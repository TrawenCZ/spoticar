import { useState } from "react";
import "./App.css";
import NavBar from "./components/NavBar";
import SketchBody from "./components/P5ReactLibsCanGoFuckThemselves";

function App() {
  const [userInteractedWithPage, setUserInteractedWithPage] = useState(false);

  return (
    <div className="App">
      <NavBar />
      {!userInteractedWithPage && (
        <button
          className="btn btn-primary"
          onClick={() => setUserInteractedWithPage(true)}
        >
          Click here to allow audio API
        </button>
      )}
      {userInteractedWithPage && <SketchBody />}
    </div>
  );
}

export default App;
