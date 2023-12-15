import React, { createContext, useContext, useState } from "react";
import { Session } from "../../utils/types/session";

const SessionContext = createContext<{
  session: Session;
  setSession: (_: Session) => void;
}>({ session: { status: "unauthenticated" }, setSession: (_: Session) => {} });

export const SessionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const existingSession = localStorage.getItem("SpotifySession")
    ? JSON.parse(localStorage.getItem("SpotifySession")!)
    : null;
  const sessionIsValid =
    existingSession &&
    existingSession.status === "authenticated" &&
    existingSession.accessToken &&
    existingSession.expiresAt &&
    existingSession.avatar &&
    existingSession.name &&
    existingSession.expiresAt > Date.now();
  const [session, setSessionFromInside] = useState<Session>(
    sessionIsValid
      ? existingSession
      : {
          status: "unauthenticated",
        }
  );

  const voidSetter = (newSession: Session) => {
    localStorage.setItem("SpotifySession", JSON.stringify(newSession));
    setSessionFromInside(newSession);
  };
  return (
    <SessionContext.Provider
      value={{ session: session, setSession: voidSetter }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export function useSession() {
  return useContext(SessionContext);
}
