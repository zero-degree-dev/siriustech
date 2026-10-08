import "server-only";
/** Read only inside a future server adapter, never during build or in client code. */
export function getApiConfig() {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl)
    throw new Error("API_BASE_URL is required for the HTTP adapter");
  const url = new URL(baseUrl);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("API_BASE_URL must use HTTP(S)");
  return { baseUrl: url.toString(), token: process.env.API_TOKEN };
}
