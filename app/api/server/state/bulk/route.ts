import type { NextRequest } from "next/server"
import { getAccessTokenOrResponse, proxyJsonRequest } from "../../marketplace/_shared"

export async function POST(req: NextRequest) {
  const session = await getAccessTokenOrResponse()
  if (!session.ok) return session.unauthorized
  const body = await req.json()
  return proxyJsonRequest("/state/bulk", "POST", session.accessToken, body)
}