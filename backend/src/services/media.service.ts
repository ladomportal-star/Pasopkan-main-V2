import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
const buckets = { public: "listing-media", private: "private-media" } as const;
function storage() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey)
    throw new HttpError(503, "Media storage is not configured");
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).storage;
}
export async function uploadImage(uid: string, dataUrl: string, visibility: "public" | "private") {
  if (!/^[a-zA-Z0-9_-]+$/.test(uid)) throw new HttpError(400, "Invalid identity");
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new HttpError(400, "Only PNG, JPEG and WebP images are supported");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length < 12 || bytes.length > 5 * 1024 * 1024)
    throw new HttpError(400, "Image must be between 12 bytes and 5 MB");
  const valid =
    match[1] === "png"
      ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : match[1] === "jpeg"
        ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (!valid) throw new HttpError(400, "Image content does not match its type");
  const bucket = buckets[visibility];
  const key = `${uid}/${randomUUID()}.${match[1]}`;
  const { error } = await storage()
    .from(bucket)
    .upload(key, bytes, { contentType: `image/${match[1]}`, upsert: false });
  if (error) throw new HttpError(502, "Image upload failed");
  return `storage://${bucket}/${key}`;
}
export async function resolveImage(uid: string | undefined, ref: string) {
  const match =
    /^storage:\/\/(listing-media|private-media)\/([a-zA-Z0-9_-]+)\/([a-f0-9-]+\.(?:png|jpeg|webp))$/.exec(
      ref,
    );
  if (!match) throw new HttpError(400, "Invalid media reference");
  const [, bucket, owner, file] = match;
  const key = `${owner}/${file}`;
  if (bucket === buckets.public) return storage().from(bucket).getPublicUrl(key).data.publicUrl;
  if (owner !== uid) throw new HttpError(403, "Private media belongs to another user");
  const { data, error } = await storage().from(bucket).createSignedUrl(key, 300);
  if (error || !data) throw new HttpError(502, "Could not open private image");
  return data.signedUrl;
}

export function assertMediaReferences(
  value: unknown,
  uid: string,
  visibility?: "public" | "private",
) {
  if (typeof value === "string") {
    if (/data:|base64,/i.test(value)) throw new HttpError(400, "Upload images before saving");
    if (value.includes("/storage/v1/object/sign/"))
      throw new HttpError(400, "Store a media reference, not an expiring signed URL");
    if (value.startsWith("storage://")) {
      const match =
        /^storage:\/\/(listing-media|private-media)\/([a-zA-Z0-9_-]+)\/([a-f0-9-]+\.(?:png|jpeg|webp))$/.exec(
          value,
        );
      if (!match || match[2] !== uid) throw new HttpError(403, "Media ownership mismatch");
      if (visibility && match[1] !== buckets[visibility])
        throw new HttpError(400, "Incorrect media visibility");
    }
  } else if (Array.isArray(value)) value.forEach((v) => assertMediaReferences(v, uid, visibility));
  else if (value && typeof value === "object")
    Object.values(value).forEach((v) => assertMediaReferences(v, uid, visibility));
}
