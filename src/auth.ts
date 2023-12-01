import NextAuth from "next-auth/next";
import SpotifyProvider from "next-auth/providers/spotify";

const spotifyScope =
  "streaming \
    user-read-email \
    user-read-private";

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
      if (account?.access_token) {
        token.access_token = account?.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session && token?.access_token) {
        session.user.token = token.access_token;
      }
      return session;
    },
  },
});
