import { getAccessTokenOrResponse, proxyJsonRequest } from "../../../_shared";

export async function GET(
  _req: Request,
  context: { params: Promise<{ categoryId: string }> },
) {
  const { categoryId } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;
  return proxyJsonRequest(
    `/categories/${categoryId}/attributes`,
    "GET",
    session.accessToken,
  );
}

