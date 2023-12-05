export type Session =
  | {
      status: "authenticated" | "loading";
      name: string;
      email: string;
      avatar: string;
      accessToken: string;
      expiryTime: number;
      getNewAccessToken: () => Promise<void>;
      getNewAccessTokenIfExpired: () => Promise<void>;
    }
  | { status: "unauthenticated" };
