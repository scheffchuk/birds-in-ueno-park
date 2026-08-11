export type ProxyPathScope = "public" | "admin" | "api";

export function classifyProxyPath(pathname: string): ProxyPathScope {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "admin";
  }
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return "api";
  }
  return "public";
}

export function requiresConvexAuthMiddleware(pathname: string): boolean {
  const scope = classifyProxyPath(pathname);
  return scope === "admin" || scope === "api";
}

export function requiresI18nMiddleware(pathname: string): boolean {
  return classifyProxyPath(pathname) === "public";
}
