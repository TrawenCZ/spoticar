import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFetcherForExpress } from "../utils/fetchers";
import { Session } from "../utils/types/session";
import Loading from "./LoadingAnimation";
import { useSession } from "./providers/SessionProvider";

export default function SessionRefresher() {
  const { session, setSession } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    getFetcherForExpress<Session>("/session").then((res) => {
      if (res.status === "success") {
        setSession(res.data);
      } else {
        console.log("Session request failed, error: " + res.data?.message);
      }
      navigate("/", { replace: true });
    });
  }, []);
  return <Loading />;
}
