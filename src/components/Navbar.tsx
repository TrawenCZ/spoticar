"use client";

import ExpandLessIcon from "@material-symbols/svg-400/outlined/expand_less-fill.svg";
import ExpandMoreIcon from "@material-symbols/svg-400/outlined/expand_more-fill.svg";
import { useSession } from "next-auth/react";
import { useState } from "react";
import ProfileCard from "./ProfileCard";

export default function NavBar() {
  const [show, setShow] = useState(true);
  const authenticated = useSession().status === "authenticated";
  return (
    <>
      <div className="flex flex-col justify-center w-full">
        {show && (
          <div className="navbar bg-base-100 justify-end">
            <ProfileCard />
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
