import { CountrySearch, type SearchState } from './countrySearch.js';
import { debounce } from './debounce.js';
import { searchCountries } from './searchCountries.js';

const DEBOUNCE_DELAY_MS = 300;

const input = document.createElement('input');
input.type = 'search';
input.placeholder = 'Введите название страны';

const list = document.createElement('ul');

document.body.append(input, list);

function render(state: SearchState): void {
  list.replaceChildren();

  if (state.status !== 'results') {
    return;
  }

  for (const country of state.countries) {
    const item = document.createElement('li');
    item.textContent = country.name;
    list.append(item);
  }
}

const countrySearch = new CountrySearch(searchCountries, render);
const debouncedSearch = debounce((query: string) => {
  void countrySearch.search(query);
}, DEBOUNCE_DELAY_MS);

input.addEventListener('input', () => {
  const query = input.value.trim();
  countrySearch.input(query);
  debouncedSearch(query);
});
