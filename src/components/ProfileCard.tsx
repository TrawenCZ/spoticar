"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

export default function ProfileCard() {
  const session = useSession();
  if (session.status === "authenticated") {
    return (
      <>
        <div className="dropdown dropdown-end">
          {session.data.user?.image ? (
            <div
              className="flex flex-col items-center justify-center btn btn-ghost btn-circle"
              role="button"
              tabIndex={0}
            >
              <div className="avatar">
                <div className="rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <Image
                    src={session.data.user?.image}
                    alt="Avatar"
                    width={1000}
                    height={1000}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div
              className="avatar placeholder btn btn-ghost btn-circle"
              role="button"
              tabIndex={0}
            >
              <div className="bg-neutral text-neutral-content rounded-full">
                <span className="text-3xl">
                  {session.data.user?.name || ":)"}
                </span>
              </div>
            </div>
          )}
          <ul
            tabIndex={0}
            className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box"
          >
            <li>
              <a className="font-extrabold">{session.data.user?.name}</a>
            </li>
            <li>
              <a className="font-thin">{session.data.user?.email}</a>
            </li>
            <li className="mt-4">
              <button className="btn btn-error" onClick={() => signOut()}>
                Sign Out
              </button>
            </li>
          </ul>
        </div>
      </>
    );
  }
  return (
    <button className="btn btn-primary" onClick={() => signIn()}>
      Sign In
    </button>
  );
}
