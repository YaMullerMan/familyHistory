(function () {

    const list        = document.getElementById('fa-people-list');
    const searchInput = document.getElementById('fa-people-search');
    const emptyState  = document.getElementById('fa-search-empty');
    const emptyTerm   = document.getElementById('fa-search-empty-term');

    if (!searchInput || !list) return;

    const originalHTML = list.innerHTML;

    // ── Helpers ───────────────────────────────────────────────────────────────

    function personName(p) {
        const acf   = p.acf || {};
        const parts = [acf.first_name, acf.last_name].filter(Boolean);
        return parts.length ? parts.join(' ') : (p.title?.rendered || p.title || '(unknown)');
    }

    function esc(s) {
        const el = document.createElement('span');
        el.textContent = String(s ?? '');
        return el.innerHTML;
    }

    function initials(p) {
        const acf = p.acf || {};
        return ((acf.first_name?.[0] || '') + (acf.last_name?.[0] || '')).toUpperCase() || '?';
    }

    function years(p) {
        const acf = p.acf || {};
        const b   = acf.birth_date ? acf.birth_date.slice(0, 4) : null;
        const d   = acf.death_date ? acf.death_date.slice(0, 4) : null;
        if (!b) return '';
        return d ? `${b}–${d}` : `b. ${b}`;
    }

    // ── Render a flat search-results list ─────────────────────────────────────

    function renderResults(people) {
        if (!people.length) return '';

        const rows = people.map(p => {
            const acf       = p.acf || {};
            const name      = personName(p);
            const maiden    = acf.maiden_name ? `<span class="fa-person-row__maiden">née ${esc(acf.maiden_name)}</span>` : '';
            const yrs       = years(p);
            const deceased  = acf.is_living === 0 || acf.is_living === false ? ' fa-person-row--deceased' : '';
            const thumb     = acf.profile_photo?.sizes?.thumbnail || acf.profile_photo?.url || null;
            const avatarInner = thumb
                ? `<img src="${esc(thumb)}" alt="">`
                : `<span class="fa-person-row__initials">${esc(initials(p))}</span>`;

            return `
                <li>
                    <a href="${esc(p.link || '#')}" class="fa-person-row${deceased}">
                        <span class="fa-person-row__avatar">${avatarInner}</span>
                        <span class="fa-person-row__name">${esc(name)} ${maiden}</span>
                        <span class="fa-person-row__meta">
                            ${yrs ? `<span class="fa-person-row__years">${esc(yrs)}</span>` : ''}
                        </span>
                    </a>
                </li>`;
        }).join('');

        return `<ul class="fa-person-list">${rows}</ul>`;
    }

    // ── Search ────────────────────────────────────────────────────────────────

    let timer;

    searchInput.addEventListener('input', function () {
        clearTimeout(timer);
        const q = this.value.trim();

        if (!q) {
            list.innerHTML    = originalHTML;
            list.hidden       = false;
            emptyState.hidden = true;
            return;
        }

        timer = setTimeout(async () => {
            try {
                const results = await FA.get('wp/v2/fa_person', {
                    search:   q,
                    per_page: 50,
                    _fields:  'id,title,link,acf',
                    orderby:  'title',
                    order:    'asc',
                });

                emptyState.hidden = true;

                if (!results.length) {
                    list.innerHTML    = '';
                    list.hidden       = true;
                    emptyTerm.textContent = q;
                    emptyState.hidden = false;
                    return;
                }

                list.hidden    = false;
                list.innerHTML = renderResults(results);
            } catch (err) {
                console.error('People search error:', err);
            }
        }, 250);
    });

    searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            this.value        = '';
            list.innerHTML    = originalHTML;
            list.hidden       = false;
            emptyState.hidden = true;
        }
    });

}());
