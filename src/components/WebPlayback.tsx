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
  const [is_active, setActive] = useState(false);
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [current_track, setTrack] = useState(track);

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
        name: "Web Playback SDK",
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
          !state ? setActive(false) : setActive(true);
        });
      });

      player.connect();
    };
  }, []);

  if (!is_active || !player) {
    return (
      <>
        <div className="container">
          <div className="main-wrapper">
            <b>
              {" "}
              Instance not active. Transfer your playback using your Spotify app{" "}
            </b>
          </div>
        </div>
      </>
    );
  } else {
    return (
      <>
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
                onClick={() => player.previousTrack()}
              >
                <SkipPreviousIcon />
              </button>

              <button
                className="btn btn-ghost"
                id="togglePlay"
                onClick={() => player.togglePlay()}
              >
                {is_paused ? <PlayIcon /> : <PauseIcon />}
              </button>

              <button
                className="btn btn-ghost"
                onClick={() => player.nextTrack()}
              >
                <SkipNextIcon />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default WebPlayback;
