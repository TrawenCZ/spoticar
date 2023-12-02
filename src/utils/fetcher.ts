import axios, { AxiosError, AxiosResponse } from "axios";
import path from "path";

const responseHandler = <T>(
  response: Promise<AxiosResponse<T, any>>
): Promise<
  { success: true; data: T } | { success: false; data: AxiosError }
> => {
  try {
    return response.then((res) => ({
      success: true,
      data: res.data,
    }));
  } catch (error) {
    if (error instanceof AxiosError) {
      return Promise.resolve({ success: false, data: error });
    } else {
      return Promise.resolve({
        success: false,
        data: new AxiosError("Unknown error"),
      });
    }
  }
};

const domainAdder = (urlSlug: string) =>
  path.join("https://api.spotify.com/v1", urlSlug);

export const getFetcher = <T>(urlSlug: string, accessToken: string) =>
  responseHandler(
    axios.get<T>(domainAdder(urlSlug), {
      headers: { Authorization: "Bearer " + accessToken },
    })
  );

export const putFetcher = <T>(urlSlug: string, accessToken: string, data: T) =>
  responseHandler(
    axios.put(domainAdder(urlSlug), data, {
      headers: { Authorization: "Bearer " + accessToken },
    })
  );

export const postFetcher = <T>(urlSlug: string, accessToken: string, data: T) =>
  responseHandler(
    axios.post(domainAdder(urlSlug), data, {
      headers: { Authorization: "Bearer " + accessToken },
    })
  );
