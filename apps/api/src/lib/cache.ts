import type { Response } from "express";

const buildCacheControl = (maxAgeSeconds: number, staleWhileRevalidateSeconds: number) =>
  [
    "public",
    `max-age=${maxAgeSeconds}`,
    `s-maxage=${maxAgeSeconds}`,
    `stale-while-revalidate=${staleWhileRevalidateSeconds}`,
  ].join(", ");

export const setProductsListCache = (res: Response) => {
  res.set("Cache-Control", buildCacheControl(60, 300));
};

export const setCategoriesListCache = (res: Response) => {
  res.set("Cache-Control", buildCacheControl(300, 600));
};
