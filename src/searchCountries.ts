import { HttpError } from './httpError.js';

const COUNTRIES_URL = 'https://countries.dev/name/';
const DEFAULT_TIMEOUT_MS = 10000;

export async function searchCountries(
  query: string,
  signal: AbortSignal,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<unknown[]> {
  const requestSignal = AbortSignal.any([
    signal,
    AbortSignal.timeout(timeoutMs),
  ]);

  const response = await fetch(COUNTRIES_URL + encodeURIComponent(query), {
    signal: requestSignal,
  });

  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    throw new HttpError(response.status);
  }

  return response.json();
}
