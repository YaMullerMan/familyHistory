(function () {

    const grid        = document.getElementById('fa-stories-grid');
    const searchInput = document.getElementById('fa-story-search');
    const emptyState  = document.getElementById('fa-search-empty');
    const emptyTerm   = document.getElementById('fa-search-empty-term');

    if (!searchInput || !grid) return;

    // Snapshot the server-rendered HTML so we can restore it when search clears
    const originalHTML = grid.innerHTML;

    // ── Helpers ───────────────────────────────────────────────────────────────

    function esc(s) {
        const el = document.createElement('span');
        el.textContent = String(s ?? '');
        return el.innerHTML;
    }

    function fmtDate(str) {
        if (!str) return null;
        const [y, m, d] = str.split('-');
        const months = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
        return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
    }

    function stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html || '';
        return div.textContent || '';
    }

    function truncate(text, max = 160) {
        if (!text) return '';
        const t = text.trim();
        return t.length > max ? t.slice(0, max).trimEnd() + '…' : t;
    }

    // ── Render a single story card from API data ───────────────────────────

    function renderCard(story) {
        const acf     = story.acf || {};
        const title   = story.title?.rendered || '(Untitled)';
        const link    = story.link || '#';
        const date    = fmtDate(acf.story_date);
        const cover   = acf.cover_image;
        const thumb   = cover && typeof cover === 'object' ? (cover.sizes?.medium || cover.url) : null;
        const text    = truncate(stripHtml(acf.story_content));
        const initial = (title[0] || '?').toUpperCase();

        const coverHTML = thumb
            ? `<img src="${esc(thumb)}" alt="${esc(title)}" loading="lazy">`
            : `<span class="fa-story-item__initial">${esc(initial)}</span>`;

        return `
            <a href="${esc(link)}" class="fa-story-item">
                <div class="fa-story-item__cover ${thumb ? '' : 'fa-story-item__cover--placeholder'}">
                    ${coverHTML}
                </div>
                <div class="fa-story-item__body">
                    <h2 class="fa-story-item__title">${esc(title)}</h2>
                    ${date  ? `<div class="fa-story-item__date">${esc(date)}</div>` : ''}
                    ${text  ? `<p  class="fa-story-item__excerpt">${esc(text)}</p>` : ''}
                </div>
            </a>`;
    }

    // ── Search ────────────────────────────────────────────────────────────────

    let timer;

    searchInput.addEventListener('input', function () {
        clearTimeout(timer);
        const q = this.value.trim();

        if (!q) {
            grid.innerHTML = originalHTML;
            grid.hidden    = false;
            emptyState.hidden = true;
            return;
        }

        timer = setTimeout(async () => {
            try {
                const results = await FA.get('wp/v2/fa_story', {
                    search:   q,
                    per_page: 24,
                    _fields:  'id,title,link,acf',
                    orderby:  'relevance',
                });

                emptyState.hidden = true;

                if (!results.length) {
                    grid.innerHTML    = '';
                    grid.hidden       = true;
                    emptyTerm.textContent = q;
                    emptyState.hidden = false;
                    return;
                }

                grid.hidden    = false;
                grid.innerHTML = results.map(renderCard).join('');
            } catch (err) {
                console.error('Story search failed:', err);
            }
        }, 300);
    });

    // Clear on Escape
    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            this.value    = '';
            grid.innerHTML = originalHTML;
            grid.hidden    = false;
            emptyState.hidden = true;
        }
    });

}());
