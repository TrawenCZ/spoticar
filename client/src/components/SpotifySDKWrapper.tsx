import PlaybackController from "@/components/SpotifyController";
import { useCallback } from "react";
import { WebPlaybackSDK } from "react-spotify-web-playback-sdk";

export const MySpotifyPlayerWrapper: React.FC<{ token: string }> = ({
  token,
}: {
  token: string;
}) => {
  const getOAuthToken: Spotify.PlayerInit["getOAuthToken"] = useCallback(
    (callback) => callback(token),
    [token]
  );

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
