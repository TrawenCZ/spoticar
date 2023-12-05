import { Session } from "@/utils/types/session";
import React, { createContext, useContext, useState } from "react";

const SessionContext = createContext<Session>({ status: "unauthenticated" });
const [session, setSessionFromInside] = useState<Session>({
  status: "unauthenticated",
});

export const SessionProvider = ({
  children,
  initSession = null,
}: {
  children: React.ReactNode;
  initSession: Session | null;
}) => {
  if (initSession) {
    setSession(initSession);
  }
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
};

export function useSession() {
  return useContext(SessionContext);
}

export function setSession(session: Session) {
  setSessionFromInside(session);
}
