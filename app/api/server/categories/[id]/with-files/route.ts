import { NextRequest } from "next/server";

import {
  getAccessTokenOrResponse,
  proxyMultipartRequest,
} from "../../../marketplace/_shared";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getAccessTokenOrResponse();
  if (!session.ok) return session.unauthorized;

  const formData = await req.formData();
  return proxyMultipartRequest(`/categories/${id}/with-files`, "PATCH", session.accessToken, formData);
}

