import NextAuth from "next-auth/next";
import SpotifyProvider from "next-auth/providers/spotify";

const spotifyScope =
  "streaming \
    user-read-email \
    user-read-private";

export default NextAuth({
  // Configure one or more authentication providers
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
});
