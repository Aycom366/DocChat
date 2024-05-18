/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {Array<string>}
 */
export const publicRoutes: Array<string> = ["/", "/pricing"];

/**
 * An array of routes that are requires authentication
 * @type {string[]}
 */
export const authRoutes: string[] = ["/auth/login", "/auth/register"];

/**
 * This should always be allowed
 * @type {string[]}
 */
export const apiAuthPrefix: string[] = [
  "/api/auth",
  "/api/uploadthing",
  "/api/webhooks",
];

/**
 * The default route to redirect to after a successful login
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT: string = "/dashboard";
