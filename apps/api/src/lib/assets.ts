import path from "path";
import { fileURLToPath } from "url";
import type { Request } from "express";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const productImagesDir = path.resolve(__dirname, "../../../web/public/img/products");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!isRecord(value)) return false;

  return Object.prototype.toString.call(value) === "[object Object]";
};

const isRelativePublicAsset = (value: string) => value.startsWith("/img/");

export const toAbsoluteAssetUrl = (assetUrl: string, req: Pick<Request, "protocol" | "get">) => {
  if (!isRelativePublicAsset(assetUrl)) return assetUrl;

  const host = req.get("host");
  if (!host) return assetUrl;

  return `${req.protocol}://${host}${assetUrl}`;
};

export const normalizeAssetUrls = <T>(value: T, req: Pick<Request, "protocol" | "get">): T => {
  if (Array.isArray(value)) {
    const normalizedItems: unknown[] = value.map((item): unknown => normalizeAssetUrls(item, req));
    return normalizedItems as T;
  }

  if (!isPlainObject(value)) return value;

  const output: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    if ((key === "url" || key === "imageUrl") && typeof entry === "string") {
      output[key] = toAbsoluteAssetUrl(entry, req);
      continue;
    }

    output[key] = normalizeAssetUrls(entry, req);
  }

  return output as T;
};
