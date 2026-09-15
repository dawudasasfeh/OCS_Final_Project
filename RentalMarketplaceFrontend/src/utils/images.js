import client from "../api/client";

/**
 * Turns a stored image path into something the browser can load.
 *
 * The API stores relative paths ("/uploads/houses/9f2c.jpg") so the database is
 * not tied to a hostname. But the app runs on :5174 and the API on :7137, so a
 * relative path would resolve against the wrong origin. This resolves it
 * against the API instead.
 */
// `?? ""` so a build missing VITE_API_URL shows broken images and the error
// client.js logs, rather than a blank page from a crash at import time.
const API_ORIGIN = (client.defaults.baseURL ?? "").replace(/\/api\/?$/, "");

export function imageUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}
