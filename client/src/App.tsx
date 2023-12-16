import { useState } from "react";
import "./App.css";
import NavBar from "./components/NavBar";
import SketchBody from "./components/SketchBody";
import { useAlbumCover } from "./components/providers/AlbumCoverProvider";
import { useSession } from "./components/providers/SessionProvider";

function App() {
  const [userInteractedWithPage, setUserInteractedWithPage] = useState(false);
  const { session } = useSession();
  const authenticated = session.status === "authenticated";
  const { albumCoverUri } = useAlbumCover();

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
      {userInteractedWithPage && albumCoverUri && (
        <div className="fixed left-0 top-0">
          {" "}
          <SketchBody albumCoverUri={albumCoverUri} />
        </div>
      )}
    </div>
  );
}

export default App;
