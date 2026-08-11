import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import createMiddleware from "next-intl/middleware";
import type { NextFetchEvent, NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { requiresConvexAuthMiddleware } from "./lib/proxy/path-scope";

const handleI18nRouting = createMiddleware(routing);

const handleAuthRoutes = convexAuthNextjsMiddleware();

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (requiresConvexAuthMiddleware(request.nextUrl.pathname)) {
    return handleAuthRoutes(request, event);
  }
  return handleI18nRouting(request);
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
