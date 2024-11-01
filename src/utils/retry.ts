import { Response } from "node-fetch";
import { sleep } from "./sleep";

export const retry = async <T>(
  fetcher: () => Promise<Response>,
  retries: number = 10
): Promise<T> => {
  while (retries-- > 0) {
    const response = await fetcher();
    if (response.status === 429) {
      await sleep(1000);
      continue;
    }

    const text = await response.text();

    // the Hypeliquid RPC is returning a non-standed rate limiting error
    if (text === "rate limited") {
      await sleep(1000);
      continue;
    }

    return JSON.parse(text) as T;
  }

  throw new Error("failed to fetch the resource");
};
