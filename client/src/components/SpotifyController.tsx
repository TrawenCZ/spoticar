import { ReactComponent as ErrorIcon } from "@material-symbols/svg-400/outlined/error-fill.svg";
import { ReactComponent as PauseIcon } from "@material-symbols/svg-400/outlined/pause.svg";
import { ReactComponent as PlayIcon } from "@material-symbols/svg-400/outlined/play_arrow.svg";
import { ReactComponent as SkipNextIcon } from "@material-symbols/svg-400/outlined/skip_next.svg";
import { ReactComponent as SkipPreviousIcon } from "@material-symbols/svg-400/outlined/skip_previous.svg";
import { useEffect } from "react";
import {
  useErrorState,
  usePlaybackState,
  usePlayerDevice,
  useSpotifyPlayer,
} from "react-spotify-web-playback-sdk";
import { putFetcher } from "../utils/fetchers";
import { TransferPlaybackRequest } from "../utils/types/spotify-api";
import Loading from "./LoadingAnimation";

export default function PlaybackController({ token }: { token: string }) {
  const player = useSpotifyPlayer();
  const state = usePlaybackState();
  const device = usePlayerDevice();
  const error = useErrorState();

  useEffect(() => {
    if (!device?.device_id) {
      return;
    }
    putFetcher<TransferPlaybackRequest>("/me/player", token, {
      device_ids: [device.device_id],
      play: false,
    });
  }, [device?.device_id, token]);

  if (!player || !state) return <Loading />;

  return (
    <>
      {error && (
        <div role="alert" className="alert alert-error">
          <ErrorIcon />
          <span>{error.message}</span>
        </div>
      )}
      {!error && (
        <div className="card card-side bg-base-200 shadow-xl ml-5 max-h-[7.5rem]">
          <figure className="max-h-full aspect-square max-w-[7.5rem]">
            <img
              src={state.track_window.current_track.album.images[0].url}
              alt="Track cover"
              className="object-contain max-h-full"
            />
          </figure>

          <div className="card-body p-4">
            <div className="now-playing__side">
              <div className="now-playing__name">
                <h2 className="card-title">
                  {state.track_window.current_track.name}
                </h2>
              </div>
              <div className="now-playing__artist">
                {state.track_window.current_track.artists.map(
                  (artist, index) => (
                    <span key={artist.uri}>
                      {index > 0 ? ", " : ""}
                      {artist.name}
                    </span>
                  )
                )}
              </div>

              <div className="card-actions justify-center align-middle mt-1">
                <button
                  className="btn btn-ghost"
                  onClick={() => player.previousTrack()}
                >
                  <SkipPreviousIcon height="25" width="25" />
                </button>

                <button
                  className="btn btn-ghost"
                  id="togglePlay"
                  onClick={() => player.togglePlay()}
                >
                  {state.paused ? (
                    <PlayIcon height="25" width="25" />
                  ) : (
                    <PauseIcon height="25" width="25" />
                  )}
                </button>

                <button
                  className="btn btn-ghost"
                  onClick={() => player.nextTrack()}
                >
                  <SkipNextIcon height="25" width="25" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
