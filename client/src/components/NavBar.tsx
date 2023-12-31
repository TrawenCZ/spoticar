"use client";

import { ReactComponent as ErrorIcon } from "@material-symbols/svg-400/outlined/error-fill.svg";
import { ReactComponent as ExpandLessIcon } from "@material-symbols/svg-400/outlined/expand_less-fill.svg";
import { ReactComponent as ExpandMoreIcon } from "@material-symbols/svg-400/outlined/expand_more-fill.svg";
import { useState } from "react";
import ProfileCard from "./ProfileCard";
import SongFinder from "./SongFinder";
import { MySpotifyPlayerWrapper } from "./SpotifySDKWrapper";
import { useSession } from "./providers/SessionProvider";

export default function NavBar() {
  const [show, setShow] = useState(true);
  const { session } = useSession();
  const authenticated = session.status === "authenticated";

  if (authenticated && !session.accessToken) {
    return (
      <div role="alert" className="alert alert-error">
        <ErrorIcon />
        <span>Authenticated without token (weird af)</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col justify-center w-full">
        <div
          className={`navbar bg-base-300 justify-between backdrop-blur-sm bg-opacity-25 max-h-32 shadow-md ${
            show ? "" : "hidden"
          }`}
        >
          <img
            src="/assets/spoticar-logo-w.png"
            alt="Audio Racing"
            className="ml-6 h-20"
          />
          {authenticated && (
            <>
              <div className="ml-7">
                <MySpotifyPlayerWrapper />
              </div>{" "}
              <SongFinder />
            </>
          )}
          <div className="mr-5">
            <ProfileCard />
          </div>
        </div>

        {(authenticated || !show) && (
          <button
            className={`btn btn-ghost place-self-center bg-base-100 bg-opacity-10 rounded-md ${
              !show ? "animate-bounce" : ""
            }`}
            onClick={() => setShow((val) => !val)}
          >
            {show ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </button>
        )}
      </div>
    </>
  );
}
