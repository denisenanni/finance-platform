import { NextRequest } from "next/server";

export function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get("access_token")?.value;
  return !!token;
}