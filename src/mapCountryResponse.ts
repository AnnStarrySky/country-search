export interface CountryCard {
  name: string;
  flagUrl: string;
  capital: string;
  region: string;
  population: number;
  languages: string[];
  area: number;
  borders: string[];
  currencies: string[];
  nativeName: string;
  subregion: string;
}

interface RawLanguage {
  name?: string;
}

interface RawCurrency {
  name?: string;
  symbol?: string;
}

interface RawCountry {
  name?: string;
  flags?: { svg?: string };
  capital?: string;
  region?: string;
  population?: number;
  languages?: RawLanguage[];
  area?: number;
  borders?: string[];
  currencies?: RawCurrency[];
  nativeName?: string;
  subregion?: string;
}

function formatCurrency({ name = '', symbol }: RawCurrency): string {
  return symbol ? `${name} (${symbol})` : name;
}

export function mapCountryResponse(raw: RawCountry): CountryCard {
  return {
    name: raw.name ?? '',
    flagUrl: raw.flags?.svg ?? '',
    capital: raw.capital ?? '',
    region: raw.region ?? '',
    population: raw.population ?? 0,
    languages: (raw.languages ?? []).map(({ name = '' }) => name),
    area: raw.area ?? 0,
    borders: [...(raw.borders ?? [])],
    currencies: (raw.currencies ?? []).map(formatCurrency),
    nativeName: raw.nativeName ?? '',
    subregion: raw.subregion ?? '',
  };
}
