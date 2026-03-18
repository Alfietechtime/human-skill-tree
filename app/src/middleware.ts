import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

function getCountry(request: NextRequest): string {
  // Cloudflare header (when proxied)
  const cf = request.headers.get("cf-ipcountry");
  if (cf) return cf.toUpperCase();
  // Vercel header
  const vercel = request.headers.get("x-vercel-ip-country");
  if (vercel) return vercel.toUpperCase();
  return "";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const country = getCountry(request);
  const isCN = country === "CN";

  // If no locale prefix and detected as China, default to /zh
  const hasLocalePrefix = /^\/(en|zh|ja)(\/|$)/.test(pathname);
  if (!hasLocalePrefix && isCN) {
    const url = request.nextUrl.clone();
    url.pathname = `/zh${pathname}`;
    const response = NextResponse.redirect(url);
    response.cookies.set("geo-cn", "1", { path: "/", maxAge: 86400 });
    return response;
  }

  // Run next-intl middleware first (locale routing)
  const response = intlMiddleware(request);
  const res = response as NextResponse;

  // Set geo cookie for client-side tip banner
  if (isCN) {
    res.cookies.set("geo-cn", "1", { path: "/", maxAge: 86400 });
  }

  // Then refresh Supabase auth session cookies
  const finalResponse = await updateSession(request, res);

  return finalResponse;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
