import { getLocaleHeader } from "@lib/util/get-locale-header"
import Medusa, { FetchArgs, FetchInput } from "@medusajs/js-sdk"

import { getCacheOptions } from "@lib/data/cookies"


// Defaults to standard port for Medusa server
let MEDUSA_BACKEND_URL = "http://localhost:9000"

if (process.env.MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL
}

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
})

const originalFetch = sdk.client.fetch.bind(sdk.client)

sdk.client.fetch = async <T>(
  input: FetchInput,
  init?: FetchArgs
): Promise<T> => {
  const headers = init?.headers ?? {}
  let localeHeader: Record<string, string | null> | undefined
  // 1) locale header（保留你原逻辑）
  try {
    localeHeader = await getLocaleHeader()
    headers["x-medusa-locale"] ??= localeHeader["x-medusa-locale"]
  } catch {}

  const newHeaders = {
    ...localeHeader,
    ...headers,
  }

  // 2) Next cache tags（新增）
  // 只在服务端、只对 GET 请求打 tag
  const method = (init?.method ?? "GET").toUpperCase()
  const isServer = typeof window === "undefined"

  let nextInit: FetchArgs = {
    ...init,
    headers: newHeaders,
  }

  if (isServer && method === "GET") {
    // 从 input 推断 URL 字符串
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as any)?.url ?? ""

    // 根据 Store API 路径映射 tag（你后端发 tags 就用这些名字）
    let tag: string | null = null
    if (url.includes("/store/products")) tag = "products"
    else if (url.includes("/store/product-categories")) tag = "categories"
    else if (url.includes("/store/collections")) tag = "collections"
    // else if (url.includes("/store/regions")) tag = "regions"

    if (tag) {
      console.log("[fetch tag]", tag, url)

      const cacheOptions = await getCacheOptions(tag) // 你刚改过：products/categories/collections => 全局tag
      // 合并 next 选项（Next 扩展字段，不在 TS 类型里，用 any 合并）
      nextInit = {
        ...nextInit,
        ...(cacheOptions as any),
        next: {
          ...((nextInit as any).next ?? {}),
          ...((cacheOptions as any).next ?? {}),
        },
      } as any
    }
  }

  let cc: string | null | undefined

  const h: any = (nextInit as any)?.headers
  if (h?.get) {
    // Headers 实例
    cc = h.get("cache-control")
  } else {
    // 普通对象（可能有不同大小写）
    cc = h?.["cache-control"] ?? h?.["Cache-Control"]
  }

  if (cc) {
    const u =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as any)?.url ?? ""
    console.log("[debug] outgoing cache-control =", cc, "url =", u)
  }



  return originalFetch(input, nextInit)
}
