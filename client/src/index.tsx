import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import App from "./App";
import SessionRefresher from "./components/SessionRefresher";
import { AlbumCoverProvider } from "./components/providers/AlbumCoverProvider";
import { SessionProvider } from "./components/providers/SessionProvider";
import "./index.css";
import reportWebVitals from "./reportWebVitals";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/trigger_refresh", element: <SessionRefresher /> },
]);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <SessionProvider>
      <AlbumCoverProvider>
        <div className="text-base-content">
          <RouterProvider router={router} />
        </div>
      </AlbumCoverProvider>
    </SessionProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
