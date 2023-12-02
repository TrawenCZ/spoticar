"use client";

import ExpandLessIcon from "@material-symbols/svg-400/outlined/expand_less-fill.svg";
import ExpandMoreIcon from "@material-symbols/svg-400/outlined/expand_more-fill.svg";
import { useSession } from "next-auth/react";
import { useState } from "react";
import ProfileCard from "./ProfileCard";
import WebPlayback from "./WebPlayback";

export default function NavBar() {
  const [show, setShow] = useState(true);
  const session = useSession();
  const authenticated = session.status === "authenticated";

  return (
    <>
      <div className="flex flex-col justify-center w-full">
        {show && (
          <div className="navbar bg-base-100 justify-end">
            <ProfileCard />
            {authenticated && (
              <iframe sandbox="allow-scripts">
                <WebPlayback token={session.data?.user.token?.access_token} />
              </iframe>
            )}
          </div>
        )}

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
