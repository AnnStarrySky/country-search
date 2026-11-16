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

const layout = document.createElement('div');
layout.className = 'layout';

const list = document.createElement('ul');

const details = document.createElement('section');
details.className = 'details';
details.hidden = true;

layout.append(list, details);

document.body.append(input, statusMessage, retryButton, layout);

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

  const summary = document.createElement('p');
  summary.textContent = [
    `Столица: ${country.capital || '—'}`,
    `Регион: ${country.region || '—'}`,
    `Население: ${country.population.toLocaleString('ru-RU')}`,
  ].join(' · ');

  item.append(flag, name, summary);
  item.addEventListener('click', () => showDetails(country));
  return item;
}

function listOrDash(values: string[]): string {
  return values.length > 0 ? values.join(', ') : '—';
}

function showDetails(country: CountryCard): void {
  const title = document.createElement('h2');
  title.textContent = `${country.name} (${country.nativeName || '—'})`;

  const info = document.createElement('p');
  info.textContent = [
    `Подрегион: ${country.subregion || '—'}`,
    `Площадь: ${country.area.toLocaleString('ru-RU')} км²`,
    `Границы: ${listOrDash(country.borders)}`,
    `Языки: ${listOrDash(country.languages)}`,
    `Валюта: ${listOrDash(country.currencies)}`,
  ].join('\n');
  info.style.whiteSpace = 'pre-line';

  details.replaceChildren(title, info);
  details.hidden = false;
}

function hideDetails(): void {
  details.hidden = true;
  details.replaceChildren();
}

function render(state: SearchState): void {
  list.replaceChildren();
  hideDetails();

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
