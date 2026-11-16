import { describe, expect, it, vi } from 'vitest';
import { CountrySearch, type SearchState } from './countrySearch.js';

type SearchFn = (query: string, signal: AbortSignal) => Promise<unknown[]>;

interface PendingRequest {
  query: string;
  signal: AbortSignal;
  resolve: (countries: unknown[]) => void;
}

function createAbortAwareSearch() {
  const requests: PendingRequest[] = [];

  const searchFn: SearchFn = (query, signal) =>
    new Promise((resolve, reject) => {
      requests.push({ query, signal, resolve });
      signal.addEventListener('abort', () =>
        reject(new DOMException('Aborted', 'AbortError')),
      );
    });

  return { searchFn: vi.fn(searchFn), requests };
}

describe('search race condition', () => {
  it('shows only the result of the latest query when the older response arrives later', async () => {
    const { searchFn, requests } = createAbortAwareSearch();
    const states: SearchState[] = [];
    const search = new CountrySearch(searchFn, (state) => states.push(state));

    search.input('sp');
    const earlySearch = search.search('sp');

    search.input('spain');
    const lateSearch = search.search('spain');

    const [early, late] = requests;
    expect(early.query).toBe('sp');
    expect(late.query).toBe('spain');

    late.resolve([{ name: 'Spain' }]);
    await lateSearch;

    early.resolve([{ name: 'Sparta' }]);
    await earlySearch;

    const finalState = states[states.length - 1];
    expect(finalState.status).toBe('results');
    if (finalState.status === 'results') {
      expect(finalState.countries.map((country) => country.name)).toEqual([
        'Spain',
      ]);
    }
    expect(early.signal.aborted).toBe(true);
    expect(late.signal.aborted).toBe(false);
  });

  it('does not show an error for the aborted early request', async () => {
    const { searchFn, requests } = createAbortAwareSearch();
    const states: SearchState[] = [];
    const search = new CountrySearch(searchFn, (state) => states.push(state));

    search.input('sp');
    const earlySearch = search.search('sp');
    search.input('spain');
    const lateSearch = search.search('spain');

    requests[1].resolve([{ name: 'Spain' }]);
    await Promise.all([earlySearch, lateSearch]);

    expect(states.some((state) => state.status === 'error')).toBe(false);
  });
});
