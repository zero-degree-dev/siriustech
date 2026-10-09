import "server-only";
/** Server-only origin of the NestJS API, without the /api suffix. */
export function getApiConfig() {
  const baseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:4000';
  if (!baseUrl)
    throw new Error("API_BASE_URL is required for the HTTP adapter");
  const url = new URL(baseUrl);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("API_BASE_URL must use HTTP(S)");
  return { baseUrl: url.toString(), token: process.env.API_TOKEN };
}
