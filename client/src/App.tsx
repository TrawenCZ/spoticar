import { useState } from "react";
import "./App.css";
import NavBar from "./components/NavBar";
import SketchBody from "./components/SketchBody";

function App() {
  const [userInteractedWithPage, setUserInteractedWithPage] = useState(false);

  return (
    <div className="App fixed z-10 w-[100vw]">
      <NavBar />
      {!userInteractedWithPage && (
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
