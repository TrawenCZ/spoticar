import axios from "axios";
import { assert } from "console";
import cors from "cors";
import { randomBytes } from "crypto";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import querystring from "querystring";

dotenv.config();
assert(process.env.CLIENT_ID, "CLIENT_ID is not defined");
assert(process.env.CLIENT_SECRET, "CLIENT_SECRET is not defined");

const PORT = process.env.PORT || 3000;
const client_id = process.env.CLIENT_ID!;
const client_secret = process.env.CLIENT_SECRET!;
const redirect_uri =
  process.env.REDIRECT_URI || `http://localhost:${PORT}/callback`;

const scope =
  "streaming \
user-read-email \
user-read-private \
user-read-playback-state \
user-modify-playback-state \
user-read-currently-playing";

let curr_session: {
  name: string;
  email: string;
  avatar: string;
  accessToken: string;
  expiresAt: number;
} | null = null;

let curr_refresh_token: string | null = null;
let curr_state: string | null = null;
// please don't have a security heart attack, I will only use this app for myself at localhost

const api = express();

api.use(function (req, res, next) {
  if (req.path.slice(-1) === "/" && req.path.length > 1) {
    let query = req.url.slice(req.path.length);
    res.redirect(301, req.path.slice(0, -1) + query);
  } else {
    next();
  }
});

api.use(express.json());

api.use(cors());

api.get("/album-cover/*", async (req, res) => {
  const url = req.url.slice("/album-cover".length + 1);
  const { data } = await axios(url, {
    responseType: "arraybuffer",
  });
  res.set("Content-Type", "image/jpeg");
  res.send(data);
});

api.get("/login", (req, res) => {
  curr_state = randomBytes(16).toString("hex");

  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: curr_state,
      })
  );
});

api.get("/logout", (req, res) => {
  curr_session = null;
  curr_refresh_token = null;
  res.redirect("/trigger_refresh");
});

api.get("/callback", async (req, res) => {
  const code = req.query.code?.toString();
  const { state } = req.query;

  if (state !== curr_state) {
    curr_state = null;
    return res.status(404).redirect(
      "/#" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  }
  curr_state = null;
  const {
    data: { access_token, expires_in, refresh_token },
  } = await axios({
    method: "post",
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${client_id}:${client_secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: querystring.stringify({
      code,
      redirect_uri: redirect_uri,
      grant_type: "authorization_code",
    }),
  });
  if (!access_token || !refresh_token) {
    return res.status(404).redirect(
      "/#" +
        querystring.stringify({
          error: "no_token",
        })
    );
  }
  const {
    data: { email, images, display_name },
  } = await axios("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!email || !images[0]?.url || !display_name) {
    return res.status(404).redirect(
      "/#" +
        querystring.stringify({
          error: "no_user_data",
        })
    );
  }
  curr_session = {
    name: display_name,
    email: email,
    avatar: images[0].url,
    accessToken: access_token,
    expiresAt: Date.now() + expires_in * 1000,
  };
  curr_refresh_token = refresh_token;

  return res.redirect("/trigger_refresh");
});

api.get("/session", (req, res) => {
  if (!curr_session) {
    return res.json({ status: "unauthenticated" });
  }
  return res.json({ status: "authenticated", ...curr_session });
});

api.get("/refresh_session", async (req, res) => {
  if (!curr_refresh_token) {
    return res.status(404).redirect(
      "/#" +
        querystring.stringify({
          error: "no_refresh_token",
        })
    );
  }
  const {
    data: { access_token, expires_in },
  } = await axios({
    method: "post",
    url: "https://accounts.spotify.com/api/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: querystring.stringify({
      refresh_token: curr_refresh_token,
      grant_type: "refresh_token",
      client_id: client_id,
    }),
  });
  if (!access_token) {
    return res.status(404).redirect(
      "/#" +
        querystring.stringify({
          error: "no_token",
        })
    );
  }
  const {
    data: { email, images, display_name },
  } = await axios("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!email || !images[0]?.url || !display_name) {
    return res.status(404).redirect(
      "/#" +
        querystring.stringify({
          error: "no_user_data",
        })
    );
  }
  curr_session = {
    name: display_name,
    email: email,
    avatar: images[0].url,
    accessToken: access_token,
    expiresAt: Date.now() + expires_in * 1000,
  };

  return res.redirect("/");
});

api.use("/assets", express.static(path.join(__dirname, "..", "assets")));
api.use(express.static(path.join(__dirname, "..", "client", "build")));
api.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "client", "build", "index.html"));
});

api.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
