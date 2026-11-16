import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountrySearch, type SearchState } from './countrySearch.js';
import { HttpError } from './httpError.js';

type SearchFn = (query: string, signal: AbortSignal) => Promise<unknown[]>;

function createSearch(searchFn: SearchFn) {
  const states: SearchState[] = [];
  const search = new CountrySearch(searchFn, (state) => states.push(state));
  return { search, states };
}

function lastState(states: SearchState[]): SearchState {
  return states[states.length - 1];
}

function abortError(): DOMException {
  return new DOMException('Aborted', 'AbortError');
}

describe('CountrySearch', () => {
  let searchFn: ReturnType<typeof vi.fn<SearchFn>>;

  beforeEach(() => {
    searchFn = vi.fn<SearchFn>();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('goes to idle and sends no request on empty input', () => {
    const { search, states } = createSearch(searchFn);

    search.input('');

    expect(lastState(states)).toEqual({ status: 'idle' });
    expect(searchFn).not.toHaveBeenCalled();
  });

  it('shows loading while the request is in flight', () => {
    searchFn.mockReturnValue(new Promise(() => {}));
    const { search, states } = createSearch(searchFn);

    search.input('spain');
    void search.search('spain');

    expect(lastState(states)).toEqual({ status: 'loading' });
  });

  it('shows mapped countries when the request succeeds', async () => {
    searchFn.mockResolvedValue([{ name: 'Spain', capital: 'Madrid' }]);
    const { search, states } = createSearch(searchFn);

    search.input('spain');
    await search.search('spain');

    const state = lastState(states);
    expect(state.status).toBe('results');
    if (state.status === 'results') {
      expect(state.countries[0].name).toBe('Spain');
      expect(state.countries[0].capital).toBe('Madrid');
    }
  });

  it('shows the empty state when there are no matches (404)', async () => {
    searchFn.mockResolvedValue([]);
    const { search, states } = createSearch(searchFn);

    search.input('zzz');
    await search.search('zzz');

    expect(lastState(states)).toEqual({ status: 'empty' });
  });

  it('shows an error on HttpError', async () => {
    searchFn.mockRejectedValue(new HttpError(500));
    const { search, states } = createSearch(searchFn);

    search.input('spain');
    await search.search('spain');

    expect(lastState(states)).toEqual({ status: 'error' });
  });

  it('shows an error on TimeoutError', async () => {
    searchFn.mockRejectedValue(new DOMException('Timeout', 'TimeoutError'));
    const { search, states } = createSearch(searchFn);

    search.input('spain');
    await search.search('spain');

    expect(lastState(states)).toEqual({ status: 'error' });
  });

  it('shows an error on a network failure', async () => {
    searchFn.mockRejectedValue(new TypeError('Failed to fetch'));
    const { search, states } = createSearch(searchFn);

    search.input('spain');
    await search.search('spain');

    expect(lastState(states)).toEqual({ status: 'error' });
  });

  it('does not show AbortError as an error', async () => {
    searchFn.mockRejectedValue(abortError());
    const { search, states } = createSearch(searchFn);

    search.input('spain');
    await search.search('spain');

    expect(states.some((state) => state.status === 'error')).toBe(false);
  });

  it('aborts the previous request on every input change', () => {
    const signals: AbortSignal[] = [];
    searchFn.mockImplementation((_query, signal) => {
      signals.push(signal);
      return new Promise(() => {});
    });
    const { search } = createSearch(searchFn);

    search.input('sp');
    void search.search('sp');
    expect(signals[0].aborted).toBe(false);

    search.input('spa');

    expect(signals[0].aborted).toBe(true);
  });

  it('aborts the in-flight request when the input is cleared', () => {
    const signals: AbortSignal[] = [];
    searchFn.mockImplementation((_query, signal) => {
      signals.push(signal);
      return new Promise(() => {});
    });
    const { search, states } = createSearch(searchFn);

    search.input('spain');
    void search.search('spain');
    search.input('');

    expect(signals[0].aborted).toBe(true);
    expect(lastState(states)).toEqual({ status: 'idle' });
  });

  it('retry repeats the last typed query', async () => {
    searchFn.mockRejectedValueOnce(new HttpError(500));
    searchFn.mockResolvedValueOnce([{ name: 'Spain' }]);
    const { search, states } = createSearch(searchFn);

    search.input('spain');
    await search.search('spain');
    expect(lastState(states)).toEqual({ status: 'error' });

    await search.retry();

    expect(searchFn).toHaveBeenCalledTimes(2);
    expect(searchFn.mock.calls[1][0]).toBe('spain');
    expect(lastState(states).status).toBe('results');
  });
});
