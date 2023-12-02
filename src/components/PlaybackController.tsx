"use client";

import Loading from "@/app/loading";
import { TransferPlaybackRequest } from "@/utils/api-types";
import { putFetcher } from "@/utils/fetcher";
import ErrorIcon from "@material-symbols/svg-400/outlined/error-fill.svg";
import PauseIcon from "@material-symbols/svg-400/outlined/pause.svg";
import PlayIcon from "@material-symbols/svg-400/outlined/play_arrow.svg";
import SkipNextIcon from "@material-symbols/svg-400/outlined/skip_next.svg";
import SkipPreviousIcon from "@material-symbols/svg-400/outlined/skip_previous.svg";
import Image from "next/image";
import { useEffect } from "react";
import {
  useErrorState,
  usePlaybackState,
  usePlayerDevice,
  useSpotifyPlayer,
} from "react-spotify-web-playback-sdk";

const deviceName = "Audio Racing";

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
  }, [device?.device_id]);

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
        <div className="card card-side bg-base-200 shadow-xl">
          <figure>
            <Image
              src={state.track_window.current_track.album.images[0].url}
              alt="Track cover"
              width={200}
              height={200}
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

              <div className="card-actions justify-center mt-4">
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
                  {state.paused ? <PlayIcon /> : <PauseIcon />}
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
        </div>
      )}
    </>
  );
}
