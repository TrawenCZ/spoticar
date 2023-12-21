import React, { useCallback } from "react";
import { WebPlaybackSDK } from "react-spotify-web-playback-sdk";
import { getFetcherForExpress } from "../utils/fetchers";
import { Session } from "../utils/types/session";
import PlaybackController from "./SpotifyController";
import { useSession } from "./providers/SessionProvider";

export const MySpotifyPlayerWrapper: React.FC = () => {
  const { session, setSession } = useSession();
  let token = session.status === "authenticated" ? session.accessToken : "";

  const getOAuthToken: Spotify.PlayerInit["getOAuthToken"] = useCallback(
    async (callback) => {
      if (
        session.status === "authenticated" &&
        session.expiresAt < Date.now()
      ) {
        const res = await getFetcherForExpress<Session>("/refresh_session");
        if (res.status === "success" && res.data.status === "authenticated") {
          token = res.data.accessToken;
          setSession(res.data);
        } else {
          alert("Could not refresh token");
        }
      }

      return callback(token);
    },
    [token]
  );

  if (session.status !== "authenticated") return null;
  return (
    <WebPlaybackSDK
      initialDeviceName="Audio Racing"
      getOAuthToken={getOAuthToken}
      initialVolume={0.5}
    >
      <PlaybackController token={token} />
    </WebPlaybackSDK>
  );
};
