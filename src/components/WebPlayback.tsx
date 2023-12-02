import Loading from "@/app/loading";
import {
  AvailableDevicesResponse,
  EmptyRequest,
  TransferPlaybackRequest,
} from "@/utils/api-types";
import { getFetcher, putFetcher } from "@/utils/fetcher";
import ErrorIcon from "@material-symbols/svg-400/outlined/error-fill.svg";
import PauseIcon from "@material-symbols/svg-400/outlined/pause.svg";
import PlayIcon from "@material-symbols/svg-400/outlined/play_arrow.svg";
import SkipNextIcon from "@material-symbols/svg-400/outlined/skip_next.svg";
import SkipPreviousIcon from "@material-symbols/svg-400/outlined/skip_previous.svg";
import { useEffect, useState } from "react";

const track = {
  name: "",
  album: {
    images: [{ url: "" }],
  },
  artists: [{ name: "" }],
};

function WebPlayback({ token }: { token: string | undefined }) {
  const [is_paused, setPaused] = useState(false);
  const [player_isActive, setPlayer_isActive] = useState(false);
  const [apiSetup_isActive, setApiSetup_isActive] = useState(false);
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [current_track, setTrack] = useState(track);
  const [error, setError] = useState<string | null>(null);

  const deviceName = "Audio Racing";
  console.log("Bearer " + token);

  if (!token) {
    return (
      <>
        <div role="alert" className="alert alert-error">
          <ErrorIcon />
          <span>No access token available!</span>
        </div>
      </>
    );
  }

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: deviceName,
        getOAuthToken: (cb) => {
          cb(token);
        },
        volume: 0.5,
      });

      setPlayer(player);

      player.addListener("ready", ({ device_id }) => {
        console.log("Ready with Device ID", device_id);
      });

      player.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
      });

      player.addListener("player_state_changed", (state) => {
        if (!state) {
          return;
        }

        setTrack(state.track_window.current_track);
        setPaused(state.paused);

        player.getCurrentState().then((state) => {
          if (!state) {
            console.error(
              "User is not playing music through the Web Playback SDK"
            );
            return;
          }
          console.log(state);
        });
      });

      player.connect();
    };
  }, []);

  useEffect(() => {
    if (!player || !token || !player_isActive || apiSetup_isActive) {
      return;
    }
    getFetcher<AvailableDevicesResponse>("/me/player/devices", token).then(
      (devices) => {
        const device_id = devices.success
          ? devices.data.devices.find((device) => device.name === deviceName)
              ?.id
          : undefined;
        if (
          !devices.success ||
          devices.data.devices.length === 0 ||
          !device_id
        ) {
          setError("Something went wrong, audio device missing.");
          return;
        }

        const transfer = putFetcher<TransferPlaybackRequest>(
          "/me/player",
          token,
          { device_ids: [device_id] }
        ).then((transfer) => {
          if (!transfer.success) {
            setError(
              "Something went wrong, audio couldn't be transfered to this device."
            );
            return;
          }
          setApiSetup_isActive(true);
        });
      }
    );
  }, [player_isActive]);
  if (!player && player_isActive) {
    setError("Something went wrong, Spotify player unavailable.");
  }
  if (!player_isActive || !apiSetup_isActive) {
    return <Loading />;
  }
  return (
    <>
      {error && (
        <div role="alert" className="alert alert-error">
          <ErrorIcon />
          <span>Something went wrong, Spotify player unavailable.</span>
        </div>
      )}
      {!error && (
        <div className="container">
          <div className="main-wrapper">
            <img
              src={current_track.album.images[0].url}
              className="now-playing__cover"
              alt=""
            />

            <div className="now-playing__side">
              <div className="now-playing__name">{current_track.name}</div>
              <div className="now-playing__artist">
                {current_track.artists[0].name}
              </div>

              <button
                className="btn btn-ghost"
                onClick={() =>
                  putFetcher<EmptyRequest>("/me/player/previous", token, {})
                }
              >
                <SkipPreviousIcon />
              </button>

              <button
                className="btn btn-ghost"
                id="togglePlay"
                onClick={() =>
                  putFetcher<EmptyRequest>("/me/player/play", token, {})
                }
              >
                {is_paused ? <PlayIcon /> : <PauseIcon />}
              </button>

              <button
                className="btn btn-ghost"
                onClick={() =>
                  putFetcher<EmptyRequest>("/me/player/next", token, {})
                }
              >
                <SkipNextIcon />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default WebPlayback;
