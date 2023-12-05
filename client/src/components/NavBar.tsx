"use client";

import ErrorIcon from "@material-symbols/svg-400/outlined/error-fill.svg";
import ExpandLessIcon from "@material-symbols/svg-400/outlined/expand_less-fill.svg";
import ExpandMoreIcon from "@material-symbols/svg-400/outlined/expand_more-fill.svg";
import { useState } from "react";
import ProfileCard from "./ProfileCard";
import { MySpotifyPlayerWrapper } from "./SpotifySDKWrapper";
import { useSession } from "./providers/SessionProvider";

export default function NavBar() {
  const [show, setShow] = useState(true);
  const session = useSession();
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
          className={`navbar bg-base-100 justify-between ${
            show ? "" : "hidden"
          }`}
        >
          {authenticated && (
            <div className="ml-5">
              <MySpotifyPlayerWrapper token={session.accessToken} />
            </div>
          )}
          <div className="mr-5">
            <ProfileCard />
          </div>
        </div>

        <button
          className="btn btn-ghost place-self-center"
          onClick={() => setShow((val) => !val)}
        >
          {show ? authenticated ? <ExpandLessIcon /> : "" : <ExpandMoreIcon />}
        </button>
      </div>
    </>
  );
}