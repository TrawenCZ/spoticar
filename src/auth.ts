import { TokenSet } from "next-auth";
import NextAuth from "next-auth/next";
import SpotifyProvider from "next-auth/providers/spotify";

const spotifyScope =
  "streaming \
    user-read-email \
    user-read-private \
    user-read-playback-state \
    user-modify-playback-state \
    user-read-currently-playing";

export default NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: spotifyScope,
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      console.log("acc", account);
      console.log("tok", token);
      if (account) {
        // Save the access token and refresh token in the JWT on the initial login
        return {
          access_token: account.access_token,
          expires_at: account.expires_at,
          refresh_token: account.refresh_token,
        };
      } else if (
        Date.now() <
        (token.expires_at ? token.expires_at : 0) * 1000
      ) {
        // If the access token has not expired yet, return it
        return token;
      } else {
        // If the access token has expired, try to refresh it
        try {
          // https://accounts.google.com/.well-known/openid-configuration
          // We need the `token_endpoint`.
          const response = await fetch(
            "https://accounts.spotify.com/api/token",
            {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                client_id: process.env.SPOTIFY_CLIENT_ID!,
                client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: token.refresh_token ? token.refresh_token : "",
              }),
              method: "POST",
            }
          );

          const tokens: TokenSet = await response.json();

          if (!response.ok) throw tokens;

          return {
            ...token, // Keep the previous token properties
            access_token: tokens.access_token,
            expires_at: token.expires_at,
            // Fall back to old refresh token, but note that
            // many providers may only allow using a refresh token once.
            refresh_token: tokens.refresh_token ?? token.refresh_token,
          };
        } catch (error) {
          console.error("Error refreshing access token", error);
          // The error property will be used client-side to handle the refresh token error
          return { ...token, error: "RefreshAccessTokenError" as const };
        }
      }
    },
    async session({ session, token }) {
      if (session && token?.access_token) {
        session.user.token = token;
        session.error = token.error;
      }
      return session;
    },
  },
});
