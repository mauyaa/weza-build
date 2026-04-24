import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("x-weza-path", req.nextUrl.pathname);
  return res;
}

export const config = {
  matcher: ["/app/:path*"],
};
