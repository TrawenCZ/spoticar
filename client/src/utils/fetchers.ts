import axios, { AxiosError, AxiosResponse } from "axios";

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
  `https://api.spotify.com/v1${urlSlug.startsWith("/") ? "" : "/"}${urlSlug}`;

const expressDomainAdder = (urlSlug: string) =>
  `http://localhost:3000${urlSlug.startsWith("/") ? "" : "/"}${urlSlug}`;

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

export const getFetcherForExpress = <T>(
  urlSlug: string
): Promise<{ status: "success"; data: T } | { status: "error"; data: any }> => {
  return axios
    .get<T>(expressDomainAdder(urlSlug))
    .then(
      (res) =>
        ({ status: "success", data: res.data } as {
          status: "success";
          data: T;
        })
    )
    .catch((err) => {
      console.log(err);
      return { status: "error", data: err };
    });
};
