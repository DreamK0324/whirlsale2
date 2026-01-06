import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

async function callRevalidate(paths: string[]) {
  const url = process.env.STOREFRONT_REVALIDATE_URL
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET

  if (!url || !secret) {
    console.warn("[revalidate] missing STOREFRONT_REVALIDATE_URL/SECRET")
    return
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({ paths }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.warn("[revalidate] failed", res.status, text)
    } else {
      console.log("[revalidate] ok", paths.join(", "))
    }
  } catch (e) {
    console.warn("[revalidate] error", e)
  }
}

export default async function handler({
  event,
}: SubscriberArgs<{ id: string }>) {
  console.log("[revalidate] event:", event.name, "id:", event.data?.id)

  await callRevalidate([
        "/dk/store",
        "/fr/store",
        "/de/store",
        "/it/store",
        "/es/store",
        "/se/store",
        "/gb/store",
    ])
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted"],
}
