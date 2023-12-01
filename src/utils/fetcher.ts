/*
import axios from "axios";
import { useEffect } from "react";
import useSWR, { SWRResponse } from "swr";
import { BareFetcher, PublicConfiguration } from "swr/_internal";

if (!process.env.NEXT_PUBLIC_CLIENT_ID) {
  throw new Error("NEXT_PUBLIC_CLIENT_ID is not set");
}
if (!process.env.NEXT_PUBLIC_CLIENT_SECRET) {
  throw new Error("NEXT_PUBLIC_CLIENT_SECRET is not set");
}

export type AccessTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};
const accessTokenFetcher = (url: string) =>
  axios
    .post<AccessTokenResponse>(
      url,
      {
        grant_type: "client_credentials",
        client_id: process.env.NEXT_PUBLIC_CLIENT_ID!,
        client_secret: process.env.NEXT_PUBLIC_CLIENT_SECRET!,
      },
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    )
    .then((res) => res.data);

export const getAccessTokenFromSpotify = () => {
  let swrResult: Partial<
    SWRResponse<
      AccessTokenResponse,
      any,
      | Partial<
          PublicConfiguration<
            AccessTokenResponse,
            any,
            BareFetcher<AccessTokenResponse>
          >
        >
      | undefined
    >
  > & { isLoading: boolean };
  if (
    localStorage.getItem("access_token") &&
    localStorage.getItem("access_token_expires_at") &&
    Date.parse(localStorage.getItem("access_token_expires_at")!) < Date.now()
  ) {
    swrResult = {
      data: {
        access_token: localStorage.getItem("access_token")!,
        token_type: "Bearer",
        expires_in: 3600,
      },
      isLoading: false,
    };
  } else {
    swrResult = useSWR<AccessTokenResponse>(
      "https://accounts.spotify.com/api/token",
      accessTokenFetcher,
      { refreshInterval: 3600 * 1000 }
    );
    useEffect(() => {
      console.log(swrResult.data);
      if (swrResult.data) {
        localStorage.setItem("access_token", swrResult.data.access_token);
        localStorage.setItem(
          "access_token_expires_at",
          new Date(Date.now() + swrResult.data.expires_in).toString()
        );
      }
    }, [swrResult.data]);
  }

  return swrResult;
};
*/
