import { CountrySearch, type SearchState } from './countrySearch.js';
import { debounce } from './debounce.js';
import { searchCountries } from './searchCountries.js';

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
      for (const country of state.countries) {
        const item = document.createElement('li');
        item.textContent = country.name;
        list.append(item);
      }
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
