import React from "react";
import ReactDOM from "react-dom/client";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import App from "./App";
import Loading from "./components/LoadingAnimation";
import { useSession } from "./components/providers/SessionProvider";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { getFetcherForExpress } from "./utils/fetchers";
import { Session } from "./utils/types/session";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route
        path="trigger_refresh"
        element={<Loading />}
        action={async () => {
          const res = await getFetcherForExpress<Session>("/session");
          if (res.status === "success") {
            useSession().setSession(res.data);
          } else {
            console.log("Session request failed, error: " + res.data?.message);
          }
          router.navigate("/", { replace: true });
        }}
      />
    </Route>
  )
);

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
