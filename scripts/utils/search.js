export default function setUpSearch() {
  const button = document.querySelector('.js-search-button');
  const input = document.querySelector('.js-search-bar');

  if (!button || !input) return;

  function searchRedirect() {
    window.location.href = `index.html?search=${input.value}`;
  }

  button.addEventListener('click', searchRedirect);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      searchRedirect();
    }
  });
}
