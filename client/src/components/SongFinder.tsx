import { useEffect, useState } from "react";
import { getFetcherWithQuery, postFetcherWithParams } from "../utils/fetchers";
import { SearchResponse } from "../utils/types/spotify-api";
import { useSession } from "./providers/SessionProvider";

export default function SongFinder() {
  const { session } = useSession();
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(
    null
  );
  const [searching, setSearching] = useState(false);

  const [addingToQueue, setAddingToQueue] = useState<{
    status: "idle" | "loading" | "success" | "failure";
    trackUri: string | null;
  }>({ status: "idle", trackUri: null });
  const [trigger, setTrigger] = useState(false);

  useEffect(() => {
    if (trigger) {
      const interval = setInterval(() => {
        setTrigger(false);
      }, 2100);
      return () => clearInterval(interval);
    }
  }, [trigger]);

  const abortController = new AbortController();

  useEffect(() => {
    if (searchValue.length < 3 || session.status !== "authenticated") {
      setSearchResults(null);
      return;
    }
    if (searching) {
      abortController.abort();
    }
    getFetcherWithQuery<SearchResponse>(
      "/search",
      session.accessToken,
      searchValue,
      abortController
    ).then((res) => {
      if (res.success) {
        setSearchResults(res.data);
      }
      setSearching(false);
    });
  }, [searchValue]);

  useEffect(() => {
    if (session.status !== "authenticated") return;
    if (addingToQueue.status === "loading") {
      console.log("Adding in progress");
      return;
    }
    if (!addingToQueue.trackUri) {
      if (
        addingToQueue.status !== "success" &&
        addingToQueue.status !== "failure"
      )
        console.log("No href provided");
      return;
    }
    if (addingToQueue.status !== "idle") return;
    setAddingToQueue({ status: "loading", trackUri: addingToQueue.trackUri });
    postFetcherWithParams("/me/player/queue", session.accessToken, {
      uri: addingToQueue.trackUri,
    }).then((res) => {
      if (res.success) {
        setAddingToQueue({
          status: "success",
          trackUri: addingToQueue.trackUri,
        });
      } else {
        setAddingToQueue({
          status: "failure",
          trackUri: addingToQueue.trackUri,
        });
      }
      setSearchResults(null);
      setAddingToQueue({ status: "idle", trackUri: null });
      setSearchValue("");
      setTrigger(true);
    });
  }, [addingToQueue]);

  return (
    <>
      <div
        // use classnames here to easily toggle dropdown open
        className={`
         ml-auto mr-8 dropdown w-full
        ${searchResults ? " dropdown-open" : ""} max-w-sm
      `}
      >
        <label className="form-control w-full" tabIndex={0}>
          <div className="label justify-start">
            <span className="label-text drop-shadow-2xl">
              Try to search your favorite song on{" "}
            </span>
            <img
              src="/assets/spotify-logo.png"
              alt="Spotify Logo"
              className="h-5 ml-[0.4rem]"
            />
          </div>
          <input
            type="text"
            placeholder="Song name, artist, album, whatever..."
            className="input input-bordered w-full opacity-50"
            onChange={(e) => {
              setSearchValue(e.target.value);
            }}
            value={searchValue}
          />
        </label>
        {(addingToQueue.status === "success" ||
          addingToQueue.status === "failure") && (
          <>
            <div className="toast toast-top toast-center">
              <div
                className={`alert ${
                  addingToQueue.status === "success"
                    ? "alert-success"
                    : "alert-error"
                } rounded-md`}
              >
                <span>
                  {addingToQueue.status === "success"
                    ? "Added to queue"
                    : "Failed to add to queue"}
                </span>
              </div>
            </div>
          </>
        )}

        {searchResults &&
          (addingToQueue.status === "idle" ||
            addingToQueue.status === "loading") && (
            <div className="dropdown-content bg-base-200 max-h-60 overflow-auto flex-col rounded-md w-full bg-opacity-60">
              <ul
                className="menu menu-compact w-full"
                // use ref to calculate the width of parent
              >
                {searchResults.tracks.items.map((track) => (
                  <li
                    id={track.id}
                    className={` ${
                      addingToQueue.status === "loading" ? "disabled" : ""
                    }`}
                    onClick={() =>
                      setAddingToQueue({ status: "idle", trackUri: track.uri })
                    }
                  >
                    <div className="card card-side bg-base-200 shadow-xl max-h-full search-res-card bg-opacity-60">
                      <figure className="max-h-full aspect-square max-w-[4rem]">
                        <img
                          src={track.album.images[0].url}
                          alt="Track cover"
                          className="object-contain max-h-full"
                        />
                      </figure>

                      <div className="card-body p-4">
                        <div className="now-playing__side">
                          <div className="now-playing__name">
                            <h2 className="card-title">{track.name}</h2>
                          </div>
                          <div className="now-playing__artist">
                            {track.artists.map((artist, index) => (
                              <span key={artist.uri}>
                                {index > 0 ? ", " : ""}
                                {artist.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="queue-tip absolute right-0 mr-1 mt-1">
                        Click to add to queue
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>
    </>
  );
}
