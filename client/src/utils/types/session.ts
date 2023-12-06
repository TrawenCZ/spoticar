export type Session =
  | {
      status: "authenticated" | "loading";
      name: string;
      email: string;
      avatar: string;
      accessToken: string;
      expiresAt: number;
    }
  | { status: "unauthenticated" };
