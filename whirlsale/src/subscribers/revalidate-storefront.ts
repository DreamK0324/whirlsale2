import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

type RevalidatePayload = {
  paths?: string[]
  tags?: string[]
}

async function callRevalidate(payload: RevalidatePayload) {
  const url = process.env.STOREFRONT_REVALIDATE_URL
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET

  if (!url || !secret) {
    console.warn("[revalidate] missing STOREFRONT_REVALIDATE_URL/SECRET")
    return
  }

  const paths = payload.paths ?? []
  const tags = payload.tags ?? []

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({ paths, tags }),
    })

    const text = await res.text().catch(() => "")
    if (!res.ok) {
      console.warn("[revalidate] failed", res.status, text)
    } else {
      console.log("[revalidate] ok", { paths, tags })
    }
  } catch (e) {
    console.warn("[revalidate] error", e)
  }
}

export default async function handler({
  event,
}: SubscriberArgs<{ id: string }>) {
  console.log("[revalidate] event:", event.name, "id:", event.data?.id)

  await callRevalidate({ tags: ["products"] })
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
}
