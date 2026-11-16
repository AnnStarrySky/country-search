import { mapCountryResponse, type CountryCard } from './mapCountryResponse.js';

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'results'; countries: CountryCard[] }
  | { status: 'empty' }
  | { status: 'error' };

type SearchFn = (query: string, signal: AbortSignal) => Promise<unknown[]>;
type StateListener = (state: SearchState) => void;
type RawCountry = Parameters<typeof mapCountryResponse>[0];

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export class CountrySearch {
  private controller: AbortController | undefined;
  private lastQuery = '';

  constructor(
    private readonly searchFn: SearchFn,
    private readonly onState: StateListener,
  ) {}

  input(query: string): void {
    this.controller?.abort();
    this.controller = undefined;
    this.lastQuery = query;

    if (query === '') {
      this.onState({ status: 'idle' });
    }
  }

  async search(query: string): Promise<void> {
    if (query === '') {
      return;
    }

    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.onState({ status: 'loading' });

    try {
      const raw = await this.searchFn(query, controller.signal);
      this.onState(toResultState(raw as RawCountry[]));
    } catch (error) {
      if (isAbortError(error)) {
        return;
      }
      this.onState({ status: 'error' });
    }
  }

  retry(): Promise<void> {
    return this.search(this.lastQuery);
  }
}

function toResultState(raw: RawCountry[]): SearchState {
  if (raw.length === 0) {
    return { status: 'empty' };
  }
  return { status: 'results', countries: raw.map(mapCountryResponse) };
}
