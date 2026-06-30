(function () {

    const grid      = document.getElementById('fa-media-grid');
    const searchEl  = document.getElementById('fa-media-search');
    const emptyEl   = document.getElementById('fa-media-empty');
    const emptyTerm = document.getElementById('fa-media-empty-term');

    if (!grid || !searchEl) return;

    const originalHTML = grid.innerHTML;

    // ── Type filter pills ─────────────────────────────────────────────────────

    let activeType = 'all';

    document.querySelectorAll('.fa-media-filter').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.fa-media-filter').forEach(b => {
                b.classList.remove('fa-media-filter--active');
                b.setAttribute('aria-pressed', 'false');
            });
            this.classList.add('fa-media-filter--active');
            this.setAttribute('aria-pressed', 'true');
            activeType = this.dataset.type;
            applyTypeFilter();
        });
    });

    function applyTypeFilter() {
        const items = grid.querySelectorAll('.fa-media-item');
        items.forEach(item => {
            const types = (item.dataset.type || '').split(' ');
            item.hidden = activeType !== 'all' && !types.includes(activeType);
        });
        const visible = grid.querySelectorAll('.fa-media-item:not([hidden])');
        grid.querySelector('.fa-media-empty')?.remove();
        if (!visible.length) {
            const msg = document.createElement('p');
            msg.className = 'fa-media-empty';
            msg.textContent = 'No items in this category.';
            grid.appendChild(msg);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    function esc(s) {
        const el = document.createElement('span');
        el.textContent = String(s ?? '');
        return el.innerHTML;
    }

    const TYPE_ICONS = {
        audio:   '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
        video:   '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
        document:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
        certificate: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
        'newspaper-clipping': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    };
    const DEFAULT_ICON = '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>';

    function typeIcon(slug) {
        const path = TYPE_ICONS[slug] || DEFAULT_ICON;
        return `<svg class="fa-media-item__icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">${path}</svg>`;
    }

    function renderCard(item) {
        const acf    = item.acf || {};
        const title  = item.title?.rendered || '(Untitled)';
        const link   = item.link || '#';
        const photo  = acf.photo;
        const thumb  = photo && typeof photo === 'object' ? (photo.sizes?.medium || photo.url) : null;
        const date   = acf.date_circa || '';
        const people = Array.isArray(acf.people_in_media) ? acf.people_in_media : [];
        const types  = Array.isArray(item.fa_media_type_data) ? item.fa_media_type_data : [];
        const typeSlug  = types[0]?.slug  || 'uncategorized';
        const typeLabel = types[0]?.name  || '';
        const typeSlugs = types.map(t => t.slug).join(' ') || 'uncategorized';

        const thumbHTML = thumb
            ? `<img src="${esc(thumb)}" alt="${esc(title)}" loading="lazy">`
            : typeIcon(typeSlug);

        const peopleNames = people.slice(0, 2).map(p => {
            const name = p.title?.rendered || '';
            return `<span>${esc(name)}</span>`;
        }).join('');
        const moreCount = people.length > 2 ? `<span>+${people.length - 2} more</span>` : '';

        return `
            <a href="${esc(link)}" class="fa-media-item" data-type="${esc(typeSlugs)}">
                <div class="fa-media-item__thumb ${thumb ? '' : 'fa-media-item__thumb--placeholder'}">
                    ${thumbHTML}
                </div>
                <div class="fa-media-item__body">
                    ${typeLabel  ? `<span class="fa-media-item__type">${esc(typeLabel)}</span>` : ''}
                    <div class="fa-media-item__title">${esc(title)}</div>
                    ${date       ? `<div class="fa-media-item__date">${esc(date)}</div>` : ''}
                    ${(peopleNames || moreCount) ? `<div class="fa-media-item__people">${peopleNames}${moreCount}</div>` : ''}
                </div>
            </a>`;
    }

    // ── Search ────────────────────────────────────────────────────────────────

    let searchTimer;

    searchEl.addEventListener('input', function () {
        clearTimeout(searchTimer);
        const q = this.value.trim();

        if (!q) {
            grid.innerHTML    = originalHTML;
            grid.hidden       = false;
            emptyEl.hidden    = true;
            activeType        = 'all';
            document.querySelectorAll('.fa-media-filter').forEach((b, i) => {
                b.classList.toggle('fa-media-filter--active', i === 0);
                b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
            });
            return;
        }

        searchTimer = setTimeout(async () => {
            try {
                const results = await FA.get('wp/v2/fa_media', {
                    search:   q,
                    per_page: 48,
                    _fields:  'id,title,link,acf,fa_media_type',
                    orderby:  'relevance',
                });

                // Enrich with type term data
                const allTypes = await FA.get('wp/v2/fa_media_type', { per_page: 100, _fields: 'id,name,slug' }).catch(() => []);
                const typeById = {};
                allTypes.forEach(t => { typeById[t.id] = t; });

                results.forEach(item => {
                    item.fa_media_type_data = (item.fa_media_type || []).map(id => typeById[id]).filter(Boolean);
                });

                emptyEl.hidden = true;

                if (!results.length) {
                    grid.innerHTML    = '';
                    grid.hidden       = true;
                    emptyTerm.textContent = q;
                    emptyEl.hidden    = false;
                    return;
                }

                grid.hidden    = false;
                grid.innerHTML = results.map(renderCard).join('');

                // Re-apply active type filter to search results
                if (activeType !== 'all') applyTypeFilter();

            } catch (err) {
                console.error('Media search failed:', err);
            }
        }, 300);
    });

    searchEl.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            this.value     = '';
            grid.innerHTML = originalHTML;
            grid.hidden    = false;
            emptyEl.hidden = true;
        }
    });

}());
