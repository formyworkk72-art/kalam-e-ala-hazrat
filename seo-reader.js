(() => {
  const main = document.querySelector('main[data-tazmeen]');
  if (!main || main.dataset.tazmeen === 'true') return;
  const headerActions = document.querySelector('.page-top .top-actions');
  const home = headerActions?.querySelector('a.site-back');
  const toast = document.getElementById('readerToast');
  const urdu = document.documentElement.lang === 'ur';
  const notify = text => { if (!toast) return; toast.textContent = text; toast.classList.add('visible'); setTimeout(() => toast.classList.remove('visible'), 1800); };

  if (headerActions && home) {
    const favorite = document.createElement('button');
    favorite.type = 'button'; favorite.id = 'readerFavoriteBtn'; favorite.className = 'reader-top-favorite';
    const slug = location.pathname.split('/').filter(Boolean).at(-1) || '';
    const id = slug.match(/-(\d+)$/)?.[1] || slug;
    const language = urdu ? 'urdu' : 'english';
    const favoriteKey = language + ':' + id;
    favorite.setAttribute('aria-pressed', 'false');
    let favorites = [];
    try { favorites = JSON.parse(localStorage.getItem('kalam-favorite-list') || '[]'); } catch (_) {}
    const paint = active => { favorite.classList.toggle('active', active); favorite.textContent = active ? '♥ Favourite' : '♡ Favourite'; favorite.setAttribute('aria-pressed', String(active)); };
    paint(favorites.includes(favoriteKey));
    favorite.addEventListener('click', () => {
      const active = !favorites.includes(favoriteKey);
      favorites = active ? [...favorites, favoriteKey] : favorites.filter(key => key !== favoriteKey);
      try { localStorage.setItem('kalam-favorite-list', JSON.stringify(favorites)); paint(active); notify(active ? 'Added to favourites' : 'Removed from favourites'); }
      catch (_) { notify('Favourite could not be saved'); }
    });
    home.after(favorite);
  }

  const title = main.querySelector('h1');
  const lyrics = document.getElementById('lyricsContent');
  if (!title || !lyrics) return;
  const tools = document.createElement('div');
  tools.className = 'reader-tools'; tools.setAttribute('role', 'group'); tools.setAttribute('aria-label', 'Reader controls');
  tools.innerHTML = '<button class="reader-tool" id="fontDecrease" type="button" aria-label="Decrease lyrics size">−</button><output class="font-value" id="fontSizeValue" aria-live="polite"></output><button class="reader-tool" id="fontIncrease" type="button" aria-label="Increase lyrics size">+</button><button class="reader-tool" id="themeToggle" type="button" aria-label="Change theme" title="Change theme">🌙</button>';
  title.after(tools);

  let theme = localStorage.getItem('kalam-theme') || 'light';
  const themes = ['light', 'dark', 'indigo'];
  if (!themes.includes(theme)) theme = 'light';
  const themeButton = tools.querySelector('#themeToggle');
  const paintTheme = () => { document.body.dataset.theme = theme; themeButton.textContent = theme === 'light' ? '🌙' : theme === 'dark' ? '🔷' : '☀️'; themeButton.title = 'Theme: ' + theme; };
  paintTheme();
  themeButton.addEventListener('click', () => { theme = themes[(themes.indexOf(theme) + 1) % themes.length]; localStorage.setItem('kalam-theme', theme); paintTheme(); });

  const sizeKey = 'kalam-seo-size:' + location.pathname;
  const compact = matchMedia('(max-width:560px)').matches;
  let size = Number(localStorage.getItem(sizeKey)) || (urdu ? (compact ? 22 : 27) : (compact ? 19 : 23));
  const min = urdu ? 16 : 14, max = urdu ? 48 : 44, output = tools.querySelector('#fontSizeValue');
  const applySize = () => { document.documentElement.style.setProperty('--reader-size', size + 'px'); output.textContent = size + 'px'; };
  applySize();
  tools.querySelector('#fontDecrease').addEventListener('click', () => { size = Math.max(min, size - 2); localStorage.setItem(sizeKey, String(size)); applySize(); });
  tools.querySelector('#fontIncrease').addEventListener('click', () => { size = Math.min(max, size + 2); localStorage.setItem(sizeKey, String(size)); applySize(); });
})();
