type RequestConfig = RequestInit & {
  baseUrl?: string;
};

export async function fetchJson<T>(
  path: string,
  config: RequestConfig = {}
): Promise<T> {
  const { baseUrl = "", ...requestInit } = config;
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(requestInit.headers ?? {}),
    },
    ...requestInit,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
