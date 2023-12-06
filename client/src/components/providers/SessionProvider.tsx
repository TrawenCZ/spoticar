import { Session } from "@/utils/types/session";
import React, { createContext, useContext, useState } from "react";

const SessionContext = createContext<{
  session: Session;
  setSession: (_: Session) => void;
}>({ session: { status: "unauthenticated" }, setSession: (_: Session) => {} });

export const SessionProvider = ({
  children,
  initSession = null,
}: {
  children: React.ReactNode;
  initSession: Session | null;
}) => {
  const [session, setSessionFromInside] = useState<Session>(
    initSession ?? {
      status: "unauthenticated",
    }
  );
  const voidSetter = (session: Session) => {
    setSessionFromInside(session);
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
