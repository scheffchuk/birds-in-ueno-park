import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
} from "@convex-dev/auth/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const handleI18nRouting = createMiddleware(routing);

const skipI18n = createRouteMatcher(["/admin(.*)", "/api(.*)"]);

export default convexAuthNextjsMiddleware((request) => {
  if (skipI18n(request)) {
    return;
  }
  return handleI18nRouting(request);
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
