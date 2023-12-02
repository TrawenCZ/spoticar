import { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session extends DefaultSession {
    error?: "RefreshAccessTokenError";
    user: {
      /** Oauth access token */
      token?: {
        access_token: string | undefined;
        expires_at: number | undefined;
        refresh_token: string | undefined;
      };
    } & DefaultSession["user"];
  }
}
declare module "next-auth/jwt" {
  /**
   * Returned by the `jwt` callback and `getToken`, when using JWT sessions
   *
   * [`jwt` callback](https://next-auth.js.org/configuration/callbacks#jwt-callback) | [`getToken`](https://next-auth.js.org/tutorials/securing-pages-and-api-routes#using-gettoken)
   */
  interface JWT {
    /** Oauth access token */
    access_token: string | undefined;
    expires_at: number | undefined;
    refresh_token: string | undefined;
    error?: "RefreshAccessTokenError";
  }
}
