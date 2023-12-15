import { useState } from "react";
import "./App.css";
import NavBar from "./components/NavBar";
import SketchBody from "./components/SketchBody";
import { useSession } from "./components/providers/SessionProvider";

function App() {
  const [userInteractedWithPage, setUserInteractedWithPage] = useState(false);
  const { session } = useSession();
  const authenticated = session.status === "authenticated";

  return (
    <div className="App fixed z-10 w-[100vw]">
      <NavBar />
      {authenticated && !userInteractedWithPage && (
        <button
          className="btn btn-primary"
          onClick={() => setUserInteractedWithPage(true)}
        >
          Click here to allow audio API
        </button>
      )}
      {userInteractedWithPage && (
        <div className="fixed left-0 top-0">
          {" "}
          <SketchBody />
        </div>
      )}
    </div>
  );
}

export default App;
