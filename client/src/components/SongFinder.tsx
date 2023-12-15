import { useEffect, useState } from "react";
import { getFetcherWithQuery, postFetcherWithParams } from "../utils/fetchers";
import { SearchResponse } from "../utils/types/spotify-api";
import Loading from "./LoadingAnimation";
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
    console.log("wtf");
    if (trigger) {
      const interval = setInterval(() => {
        setSearchResults(null);
        setAddingToQueue({ status: "idle", trackUri: null });
        setSearchValue("");
      }, 2500);
      return () => clearInterval(interval);
    }
    setTrigger(false);
  }, [trigger]);

  const abortController = new AbortController();

  useEffect(() => {
    if (searchValue.length < 3 || session.status !== "authenticated") return;
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
      setTrigger(true);
    });
  }, [addingToQueue]);

  return (
    <>
      <div
        // use classnames here to easily toggle dropdown open
        className={`
        dropdown w-full
        ${searchResults ? " dropdown-open" : ""} max-w-sm
      `}
      >
        <label className="form-control w-full" tabIndex={0}>
          <div className="label">
            <span className="label-text">
              Try to search your favorite song on Spotify
            </span>
          </div>
          <input
            type="text"
            placeholder="Type here"
            className="input input-bordered w-full"
            onChange={(e) => {
              setSearchValue(e.target.value);
            }}
            value={searchValue}
          />
        </label>
        {(addingToQueue.status === "success" ||
          addingToQueue.status === "failure") && (
          <>
            <div
              className={`alert ${
                addingToQueue.status === "success"
                  ? "alert-success"
                  : "alert-error"
              }`}
            >
              <span>
                {addingToQueue.status === "success"
                  ? "Added to queue"
                  : "Failed to add to queue"}
              </span>
            </div>
          </>
        )}

        {searchResults &&
          (addingToQueue.status === "idle" ||
            addingToQueue.status === "loading") && (
            <div className="dropdown-content bg-base-200 max-h-60 overflow-auto flex-col rounded-md w-full">
              <ul
                className="menu menu-compact w-full"
                // use ref to calculate the width of parent
              >
                {searchResults.tracks.items.map((track) => (
                  <li
                    id={track.id}
                    className={
                      addingToQueue.status === "loading" ? "disabled" : ""
                    }
                    onClick={() =>
                      setAddingToQueue({ status: "idle", trackUri: track.uri })
                    }
                  >
                    <div className="flex flex-col">
                      <a className="self-start font-bold">{track.name}</a>
                      <a className="self-end">{track.artists[0].name}</a>
                      {addingToQueue.trackUri === track.uri &&
                        addingToQueue.status === "loading" && <Loading />}
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
