import Loading from "@/components/LoadingAnimation";
import SignOutIcon from "@material-symbols/svg-400/outlined/logout.svg";
import SpotifyIcon from "../../public/spotify.svg";
import { useSession } from "./providers/SessionProvider";

export default function ProfileCard() {
  const session = useSession();
  if (session.status === "loading") return <Loading />;
  if (session.status === "authenticated") {
    return (
      <>
        <div className="dropdown dropdown-end">
          {session.avatar ? (
            <div
              className="flex flex-col items-center justify-center btn btn-ghost btn-circle"
              role="button"
              tabIndex={0}
            >
              <div className="avatar">
                <div className="rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img src={session.avatar} alt="Avatar" />
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
                <span className="text-3xl">{session.name || ":)"}</span>
              </div>
            </div>
          )}
          <ul
            tabIndex={0}
            className="mt-3 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box"
          >
            <li>
              <a className="font-extrabold">{session.name}</a>
            </li>
            <li>
              <a className="font-thin">{session.email}</a>
            </li>
            <li className="mt-4">
              <button
                className="btn btn-error flex flex-row align-middle justify-center"
                onClick={() => signOut()}
              >
                <SignOutIcon
                  style={{
                    width: "2rem",
                    height: "2rem",
                    marginTop: "0.25rem",
                  }}
                />
                <a className="mt-1">Sign Out</a>
              </button>
            </li>
          </ul>
        </div>
      </>
    );
  }
  return (
    <button className="btn btn-primary" onClick={() => signIn("spotify")}>
      <div className="flex flex-col">
        {" "}
        Sign In{" "}
        <div className="flex flex-row justify-end font-light h-3 mt-1">
          <a className="mr-1">with</a>
          <SpotifyIcon />
        </div>
      </div>
    </button>
  );
}
