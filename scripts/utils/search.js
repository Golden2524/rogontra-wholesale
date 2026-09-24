export default function setUpSearch() {
  const button = document.querySelector('.js-search-button');
  const input = document.querySelector('.js-search-bar');

  if (!button || !input) return;

  function searchRedirect() {
    const url = new URL('index.html', window.location.href);
    const search = input.value.trim();
    const category = new URL(window.location.href).searchParams.get('category');
    if (search) url.searchParams.set('search', search);
    if (category) url.searchParams.set('category', category);
    window.location.href = url.toString();
  }

  button.addEventListener('click', searchRedirect);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      searchRedirect();
    }
  });
}
