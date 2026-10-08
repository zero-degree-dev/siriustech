export class ApiError extends Error {
  constructor(
    message: string,
    public readonly kind: "http" | "network" | "timeout" | "aborted" | "parse",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export async function request<T>(
  url: string,
  options: Omit<RequestInit, "body"> & {
    json?: unknown;
    timeoutMs?: number;
  } = {},
): Promise<T | undefined> {
  const { json, timeoutMs = 10000, signal, ...init } = options;
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const headers = new Headers(init.headers);
    if (json !== undefined) headers.set("Content-Type", "application/json");
    const response = await fetch(url, {
      ...init,
      headers,
      body: json === undefined ? undefined : JSON.stringify(json),
      signal: controller.signal,
    });
    if (!response.ok)
      throw new ApiError(
        `Сервер вернул ошибку ${response.status}`,
        "http",
        response.status,
      );
    const text = await response.text();
    if (!text.trim()) return undefined;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ApiError("Некорректный ответ сервера", "parse");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (timedOut) throw new ApiError("Время ожидания истекло", "timeout");
    if (controller.signal.aborted)
      throw new ApiError("Запрос отменён", "aborted");
    throw new ApiError("Не удалось подключиться к серверу", "network");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
