import { getAccessTokenOrResponse, proxyJsonRequest } from "../_shared";

export async function GET() {
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  return proxyJsonRequest("/categories", "GET", session.accessToken);
}

