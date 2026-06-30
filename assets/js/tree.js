(async function () {

    const container     = document.getElementById('fa-tree-root');
    const loading       = document.getElementById('fa-tree-loading');
    const errorEl       = document.getElementById('fa-tree-error');
    const searchInput   = document.getElementById('fa-tree-search');
    const searchResults = document.getElementById('fa-tree-search-results');

    // ── Fetch all people ──────────────────────────────────────────────────────

    let all;
    try {
        all = await FA.listPosts('person', {
            per_page: 100,
            _fields:  'id,title,link,acf',
            orderby:  'title',
            order:    'asc',
        });
    } catch (err) {
        loading.hidden = true;
        errorEl.textContent = 'Could not load people: ' + err.message;
        errorEl.hidden = false;
        return;
    }

    loading.hidden = true;

    if (!all.length) {
        container.innerHTML = '<p class="fa-empty-state">No people in the archive yet — add some first.</p>';
        return;
    }

    // ── Build lookup maps ─────────────────────────────────────────────────────

    const byId      = {};
    all.forEach(p => { byId[p.id] = p; });
    const inArchive = new Set(all.map(p => p.id));

    // ── Helpers ───────────────────────────────────────────────────────────────

    function personName(p) {
        const acf = p.acf || {};
        if (acf.first_name || acf.last_name) {
            return [acf.first_name, acf.last_name].filter(Boolean).join(' ');
        }
        return p.title?.rendered || p.title || '(unknown)';
    }

    function personYears(p) {
        const b = p.acf?.birth_date ? p.acf.birth_date.slice(0, 4) : null;
        const d = p.acf?.death_date ? p.acf.death_date.slice(0, 4) : null;
        if (!b) return null;
        return d ? `${b}–${d}` : `b. ${b}`;
    }

    function appendSep(card) {
        const sep = document.createElement('span');
        sep.className = 'fa-tree-card__sep';
        sep.setAttribute('aria-hidden', 'true');
        sep.textContent = '+';
        card.appendChild(sep);
    }

    function makePersonLink(p) {
        const a = document.createElement('a');
        a.className = 'fa-tree-person';
        a.href = p.link || '#';
        if (!p.acf?.is_living) a.classList.add('fa-tree-person--deceased');

        const name = document.createElement('span');
        name.className = 'fa-tree-person__name';
        name.textContent = personName(p);
        a.appendChild(name);

        const yrs = personYears(p);
        if (yrs) {
            const span = document.createElement('span');
            span.className = 'fa-tree-person__years';
            span.textContent = yrs;
            a.appendChild(span);
        }

        return a;
    }

    // ── Tree renderer ─────────────────────────────────────────────────────────

    const rendered = new Set();

    /**
     * Build a <li> for one person and their descendants.
     * isOrphan = true adds the "link to parent" button on the card.
     */
    function buildNode(person, isOrphan = false) {
        if (rendered.has(person.id)) return null;
        rendered.add(person.id);

        const li = document.createElement('li');

        // ── Couple card ──────────────────────────────────────────────────────
        const card = document.createElement('div');
        card.className = isOrphan ? 'fa-tree-card fa-tree-card--orphan' : 'fa-tree-card';

        card.appendChild(makePersonLink(person));

        // Track everyone in this card so we can collect children from all of them
        const coupleIds = new Set([person.id]);

        // Direct spouses of this person
        const directSpouseIds = (person.acf?.spouses || [])
            .filter(id => inArchive.has(id) && !rendered.has(id));

        directSpouseIds.forEach(sid => {
            coupleIds.add(sid);
            rendered.add(sid);
            const spouse = byId[sid];
            if (!spouse) return;
            appendSep(card);
            card.appendChild(makePersonLink(spouse));

            // Re-marriage: check if this spouse has other partners not yet in the card
            (spouse.acf?.spouses || [])
                .filter(id => inArchive.has(id) && !rendered.has(id) && !coupleIds.has(id))
                .forEach(id => {
                    coupleIds.add(id);
                    rendered.add(id);
                    const partner = byId[id];
                    if (!partner) return;
                    appendSep(card);
                    card.appendChild(makePersonLink(partner));
                });
        });

        // "Add parent" button — only on orphan roots
        if (isOrphan) {
            const btn = document.createElement('button');
            btn.className = 'fa-tree-card__add-btn';
            btn.title = 'Link to parent in tree';
            btn.setAttribute('aria-label', 'Link ' + personName(person) + ' to a parent');
            btn.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
            btn.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                openParentPicker(person, card);
            });
            card.appendChild(btn);
        }

        li.appendChild(card);

        // ── Children — pooled from everyone in the couple card ────────────────
        const childSet = new Set();
        coupleIds.forEach(pid => {
            (byId[pid]?.acf?.children || []).forEach(id => { if (inArchive.has(id)) childSet.add(id); });
        });

        const unrendered = [...childSet].filter(id => !rendered.has(id));
        if (unrendered.length) {
            const ul = document.createElement('ul');
            ul.className = 'fa-tree';
            unrendered.forEach(cid => {
                const child = byId[cid];
                if (!child) return;
                const childLi = buildNode(child, false);
                if (childLi) ul.appendChild(childLi);
            });
            if (ul.children.length) li.appendChild(ul);
        }

        return li;
    }

    // ── Roots ─────────────────────────────────────────────────────────────────

    const roots = all.filter(p => {
        const parents = p.acf?.parents || [];
        return !parents.some(pid => inArchive.has(pid));
    });
    roots.sort((a, b) =>
        (a.acf?.birth_date || '9999').localeCompare(b.acf?.birth_date || '9999')
    );

    const rootUl = document.createElement('ul');
    rootUl.className = 'fa-tree fa-tree--root';

    let rootsRendered = 0;
    roots.forEach(root => {
        if (rendered.has(root.id)) return;
        const isOrphan = rootsRendered > 0; // first root is the main family, rest are unconnected
        const node = buildNode(root, isOrphan);
        if (node) { rootUl.appendChild(node); rootsRendered++; }
    });

    container.appendChild(rootUl);

    // ── Parent-picker popover ─────────────────────────────────────────────────

    function openParentPicker(person, anchorEl) {
        // Close any existing picker
        document.querySelectorAll('.fa-tree-parent-picker').forEach(el => el.remove());

        const picker = document.createElement('div');
        picker.className = 'fa-tree-parent-picker';
        picker.setAttribute('role', 'dialog');
        picker.setAttribute('aria-label', 'Select a parent for ' + personName(person));

        const title = document.createElement('div');
        title.className = 'fa-tree-picker__title';
        title.textContent = 'Who is a parent of ' + personName(person) + '?';
        picker.appendChild(title);

        const input = document.createElement('input');
        input.type = 'search';
        input.className = 'fa-input fa-input--sm';
        input.placeholder = 'Search people…';
        input.autocomplete = 'off';
        picker.appendChild(input);

        const list = document.createElement('ul');
        list.className = 'fa-tree-picker__results';
        picker.appendChild(list);

        // Position fixed relative to the card
        document.body.appendChild(picker);
        positionPicker(picker, anchorEl);

        input.focus();

        // Reposition on scroll (tree is horizontally scrollable)
        const scrollEl = document.querySelector('.fa-tree-scroll');
        const reposition = () => positionPicker(picker, anchorEl);
        scrollEl?.addEventListener('scroll', reposition);

        // Search
        let timer;
        input.addEventListener('input', () => {
            clearTimeout(timer);
            list.innerHTML = '';
            const q = input.value.trim();
            if (q.length < 2) return;

            timer = setTimeout(async () => {
                try {
                    const results = await FA.searchPosts('person', q);
                    const filtered = results.filter(p => p.id !== person.id);

                    if (!filtered.length) {
                        const li = document.createElement('li');
                        li.className = 'fa-tree-picker__empty';
                        li.textContent = 'No matches';
                        list.appendChild(li);
                        return;
                    }

                    filtered.forEach(match => {
                        const li  = document.createElement('li');
                        li.className = 'fa-tree-picker__result';
                        const yrs = personYears(match);
                        li.innerHTML = `<span class="fa-tree-picker__result-name">${escText(personName(match))}</span>`;
                        if (yrs) li.innerHTML += `<span class="fa-tree-picker__result-years">${escText(yrs)}</span>`;
                        li.addEventListener('mousedown', async e => {
                            e.preventDefault();
                            scrollEl?.removeEventListener('scroll', reposition);
                            picker.remove();
                            await linkToParent(person, match);
                        });
                        list.appendChild(li);
                    });
                } catch (err) {
                    const li = document.createElement('li');
                    li.className = 'fa-tree-picker__empty';
                    li.textContent = 'Search error';
                    list.appendChild(li);
                }
            }, 250);
        });

        // Close on outside click
        function handleOutside(e) {
            if (!picker.contains(e.target) && !anchorEl.contains(e.target)) {
                scrollEl?.removeEventListener('scroll', reposition);
                picker.remove();
                document.removeEventListener('mousedown', handleOutside);
            }
        }
        // Delay one tick so the button's own click doesn't immediately close it
        setTimeout(() => document.addEventListener('mousedown', handleOutside), 0);
    }

    function positionPicker(picker, anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        picker.style.top  = (rect.bottom + 6) + 'px';
        picker.style.left = rect.left + 'px';
        // Keep within right edge of viewport
        requestAnimationFrame(() => {
            const pr = picker.getBoundingClientRect();
            if (pr.right > window.innerWidth - 8) {
                picker.style.left = Math.max(8, rect.right - picker.offsetWidth) + 'px';
            }
        });
    }

    function escText(str) {
        const el = document.createElement('span');
        el.textContent = str;
        return el.innerHTML;
    }

    // ── Link a child to a parent (both directions) ────────────────────────────

    async function linkToParent(child, parent) {
        // Show a brief loading state on the tree
        container.style.opacity = '0.5';
        container.style.pointerEvents = 'none';

        try {
            const [childPost, parentPost] = await Promise.all([
                FA.getPost('person', child.id),
                FA.getPost('person', parent.id),
            ]);

            const childParents   = (childPost.acf?.parents   || []).map(Number);
            const parentChildren = (parentPost.acf?.children || []).map(Number);

            const updates = [];

            if (!childParents.includes(Number(parent.id))) {
                updates.push(FA.updatePost('person', child.id, {}, {
                    parents: [...childParents, parent.id],
                }));
            }

            if (!parentChildren.includes(Number(child.id))) {
                updates.push(FA.updatePost('person', parent.id, {}, {
                    children: [...parentChildren, child.id],
                }));
            }

            await Promise.all(updates);
            window.location.reload();
        } catch (err) {
            container.style.opacity = '';
            container.style.pointerEvents = '';
            errorEl.textContent = 'Could not link: ' + err.message;
            errorEl.hidden = false;
        }
    }

    // ── Jump-to search ────────────────────────────────────────────────────────

    let searchTimer;
    searchInput.addEventListener('input', function () {
        clearTimeout(searchTimer);
        const q = this.value.trim().toLowerCase();
        searchResults.innerHTML = '';
        if (q.length < 2) { searchResults.hidden = true; return; }

        searchTimer = setTimeout(() => {
            const matches = all.filter(p => personName(p).toLowerCase().includes(q)).slice(0, 8);
            if (!matches.length) { searchResults.hidden = true; return; }

            matches.forEach(p => {
                const li = document.createElement('li');
                li.className = 'fa-search-result';
                li.textContent = personName(p);
                li.addEventListener('mousedown', e => {
                    e.preventDefault();
                    searchInput.value = '';
                    searchResults.hidden = true;
                    scrollToNode(p.id);
                });
                searchResults.appendChild(li);
            });
            searchResults.hidden = false;
        }, 200);
    });

    document.addEventListener('click', e => {
        if (!searchInput.contains(e.target)) searchResults.hidden = true;
    });

    function scrollToNode(id) {
        const person = byId[id];
        if (!person) return;
        const anchors = container.querySelectorAll('a.fa-tree-person');
        for (const a of anchors) {
            if (a.href === person.link) {
                a.closest('.fa-tree-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                const li = a.closest('li');
                if (li) {
                    li.classList.add('fa-tree--highlight');
                    setTimeout(() => li.classList.remove('fa-tree--highlight'), 2000);
                }
                return;
            }
        }
    }

}());
