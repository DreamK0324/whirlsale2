import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret")
  if (!secret || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const paths: string[] = Array.isArray(body?.paths) ? body.paths : []
  const tags: string[] = Array.isArray(body?.tags) ? body.tags : []

  for (const p of paths) revalidatePath(p)
  for (const t of tags) revalidateTag(t)

  return NextResponse.json({ revalidated: true, paths, tags })
}
