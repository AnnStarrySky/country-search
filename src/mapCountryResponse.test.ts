import { describe, expect, it } from 'vitest';
import { mapCountryResponse } from './mapCountryResponse.js';

const spainRaw = {
  area: 505992,
  flag: '🇪🇸',
  name: 'Spain',
  flags: {
    png: 'https://flagcdn.com/w320/es.png',
    svg: 'https://flagcdn.com/es.svg',
  },
  region: 'Europe',
  borders: ['AND', 'FRA', 'GIB', 'PRT', 'MAR'],
  capital: 'Madrid',
  languages: [
    { name: 'Spanish', iso639_1: 'es', iso639_2: 'spa', nativeName: 'Español' },
  ],
  subregion: 'Southern Europe',
  currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }],
  nativeName: 'España',
  population: 47351567,
};

describe('mapCountryResponse', () => {
  it('maps a full API response to card data', () => {
    expect(mapCountryResponse(spainRaw)).toEqual({
      name: 'Spain',
      flagUrl: 'https://flagcdn.com/es.svg',
      capital: 'Madrid',
      region: 'Europe',
      population: 47351567,
      languages: ['Spanish'],
      area: 505992,
      borders: ['AND', 'FRA', 'GIB', 'PRT', 'MAR'],
      currencies: ['Euro (€)'],
      nativeName: 'España',
      subregion: 'Southern Europe',
    });
  });

  it('maps every language and currency of a country', () => {
    const raw = {
      ...spainRaw,
      languages: [
        { name: 'French', nativeName: 'Français' },
        { name: 'German', nativeName: 'Deutsch' },
      ],
      currencies: [
        { code: 'CHF', name: 'Swiss franc', symbol: 'Fr' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
      ],
    };

    const result = mapCountryResponse(raw);

    expect(result.languages).toEqual(['French', 'German']);
    expect(result.currencies).toEqual(['Swiss franc (Fr)', 'Euro (€)']);
  });

  it('uses empty values when optional fields are missing', () => {
    const result = mapCountryResponse({ name: 'Nowhere' });

    expect(result).toEqual({
      name: 'Nowhere',
      flagUrl: '',
      capital: '',
      region: '',
      population: 0,
      languages: [],
      area: 0,
      borders: [],
      currencies: [],
      nativeName: '',
      subregion: '',
    });
  });

  it('does not mutate the raw response', () => {
    const raw = JSON.parse(JSON.stringify(spainRaw));

    mapCountryResponse(raw);

    expect(raw).toEqual(spainRaw);
  });
});
