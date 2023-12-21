import { ReactComponent as SignOutIcon } from "@material-symbols/svg-400/outlined/logout.svg";
import { ReactComponent as SpotifyIcon } from "../static/spotify.svg";
import Loading from "./LoadingAnimation";
import { useSession } from "./providers/SessionProvider";

export default function ProfileCard() {
  const { session, setSession } = useSession();

  if (session.status === "loading") return <Loading />;

  if (session.status === "authenticated") {
    return (
      <>
        <div className="dropdown dropdown-end text-base-content">
          {session.avatar ? (
            <div
              className="flex flex-col items-center justify-center btn btn-ghost btn-circle"
              role="button"
              tabIndex={0}
            >
              <div className="avatar">
                <div className="rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 opacity-70">
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
            className="mt-6 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box opacity-60 bg-opacity-50"
          >
            <li>
              <a className="font-extrabold">{session.name}</a>
            </li>
            <li className="mt-4">
              <a
                href="/logout"
                className="btn btn-error flex flex-row align-middle justify-center"
              >
                <SignOutIcon height={40} width={40} />
              </a>
            </li>
          </ul>
        </div>
      </>
    );
  }
  return (
    <div className="flex flex-col">
      {" "}
      <a href="/login" className="btn btn-primary">
        Sign In{" "}
        <div className="flex flex-row justify-end font-light h-3 mt-1">
          <a className="mr-1">with</a>
          <SpotifyIcon />
        </div>
      </a>
    </div>
  );
}
