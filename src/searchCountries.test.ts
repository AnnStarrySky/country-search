import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from './httpError.js';
import { searchCountries } from './searchCountries.js';

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function pendingUntilAborted(_url: string, init: RequestInit): Promise<never> {
  return new Promise((_resolve, reject) => {
    init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
  });
}

describe('searchCountries', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('requests the country by name with an encoded query', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await searchCountries('new zealand', new AbortController().signal);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://countries.dev/name/new%20zealand',
    );
  });

  it('returns the parsed array when the response is ok', async () => {
    const countries = [{ name: 'Spain' }];
    fetchMock.mockResolvedValue(jsonResponse(countries));

    const result = await searchCountries('spain', new AbortController().signal);

    expect(result).toEqual(countries);
  });

  it('returns an empty array on 404 (no matches is not an error)', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 404));

    const result = await searchCountries('zzz', new AbortController().signal);

    expect(result).toEqual([]);
  });

  it('throws HttpError with the status on other unsuccessful responses', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));

    const promise = searchCountries('spain', new AbortController().signal);

    await expect(promise).rejects.toBeInstanceOf(HttpError);
    await expect(promise).rejects.toMatchObject({ status: 500 });
  });

  it('rejects with AbortError when the passed signal is aborted', async () => {
    fetchMock.mockImplementation(pendingUntilAborted);
    const controller = new AbortController();

    const promise = searchCountries('spain', controller.signal);
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('rejects with TimeoutError when the server does not answer in time', async () => {
    fetchMock.mockImplementation(pendingUntilAborted);

    const promise = searchCountries('spain', new AbortController().signal, 10);

    await expect(promise).rejects.toMatchObject({ name: 'TimeoutError' });
  });
});

describe('HttpError', () => {
  it('is an Error that keeps the response status', () => {
    const error = new HttpError(503);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('HttpError');
    expect(error.status).toBe(503);
  });
});
