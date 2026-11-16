import { CountrySearch, type SearchState } from './countrySearch.js';
import { debounce } from './debounce.js';
import { searchCountries } from './searchCountries.js';
import { type CountryCard } from './mapCountryResponse.js';

const DEBOUNCE_DELAY_MS = 300;

const input = document.createElement('input');
input.type = 'search';
input.placeholder = 'Введите название страны';

const statusMessage = document.createElement('p');
statusMessage.className = 'status';

const retryButton = document.createElement('button');
retryButton.type = 'button';
retryButton.textContent = 'Повторить';

const list = document.createElement('ul');

document.body.append(input, statusMessage, retryButton, list);

function showStatus(
  kind: 'loading' | 'empty' | 'error' | 'none',
  text = '',
): void {
  statusMessage.textContent = text;
  statusMessage.dataset.kind = kind;
  retryButton.hidden = kind !== 'error';
}

function createCard(country: CountryCard): HTMLLIElement {
  const item = document.createElement('li');
  item.className = 'card';

  const flag = document.createElement('img');
  flag.className = 'card-flag';
  flag.src = country.flagUrl;
  flag.alt = `Флаг: ${country.name}`;
  flag.width = 64;

  const name = document.createElement('h2');
  name.textContent = country.name;

  const details = document.createElement('p');
  details.textContent = [
    `Столица: ${country.capital || '—'}`,
    `Регион: ${country.region || '—'}`,
    `Население: ${country.population.toLocaleString('ru-RU')}`,
  ].join(' · ');

  item.append(flag, name, details);
  return item;
}

function render(state: SearchState): void {
  list.replaceChildren();

  switch (state.status) {
    case 'idle':
      showStatus('none');
      break;
    case 'loading':
      showStatus('loading', 'Загрузка...');
      break;
    case 'empty':
      showStatus('empty', 'Ничего не найдено. Попробуйте другой запрос.');
      break;
    case 'error':
      showStatus('error', 'Не удалось выполнить поиск. Проверьте соединение.');
      break;
    case 'results':
      showStatus('none');
      list.append(...state.countries.map(createCard));
      break;
  }
}

const countrySearch = new CountrySearch(searchCountries, render);
const debouncedSearch = debounce((query: string) => {
  void countrySearch.search(query);
}, DEBOUNCE_DELAY_MS);

retryButton.addEventListener('click', () => {
  void countrySearch.retry();
});

input.addEventListener('input', () => {
  const query = input.value.trim();
  countrySearch.input(query);
  debouncedSearch(query);
});

showStatus('none');
