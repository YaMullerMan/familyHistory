/**
 * RelationshipPicker — searchable multi-select for WP post relationships.
 *
 * Usage:
 *   const picker = new RelationshipPicker(containerEl, {
 *     postType: 'fa_person',
 *     max: 2,
 *     placeholder: 'Search people…',
 *   });
 *   picker.getValues();   // [42, 87]  (post IDs)
 *   picker.getSelected(); // [{id:42, title:'Jane'}, ...]
 */
class RelationshipPicker {

    constructor(container, options = {}) {
        this.container   = container;
        this.postType    = options.postType;
        this.max         = options.max || null;
        this.placeholder = options.placeholder || 'Search…';
        this.canCreate   = options.canCreate   || false;
        this.onCreate    = options.onCreate    || null;
        this.clearOnBlur = options.clearOnBlur || false;
        this.selected    = [];
        this._timer      = null;
        this._creating   = false;
        this._render();
        this._bindEvents();
    }

    // ------------------------------------------------------------------
    // DOM
    // ------------------------------------------------------------------
    _render() {
        this.container.innerHTML = `
            <div class="fa-picker">
                <div class="fa-picker__tags" hidden aria-live="polite"></div>
                <input type="text"
                       class="fa-input fa-picker__input"
                       placeholder="${this.placeholder}"
                       autocomplete="off"
                       role="combobox"
                       aria-expanded="false"
                       aria-haspopup="listbox">
                <ul class="fa-picker__dropdown" hidden role="listbox"></ul>
            </div>`;

        this._pickerEl   = this.container.querySelector('.fa-picker');
        this._tagsEl     = this.container.querySelector('.fa-picker__tags');
        this._inputEl    = this.container.querySelector('.fa-picker__input');
        this._dropdownEl = this.container.querySelector('.fa-picker__dropdown');
    }

    _bindEvents() {
        this._inputEl.addEventListener('input', () => {
            clearTimeout(this._timer);
            const q = this._inputEl.value.trim();
            if (q.length < 2) {
                this._closeDropdown();
                return;
            }
            this._timer = setTimeout(() => this._search(q), 250);
        });

        this._inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this._closeDropdown();
        });

        if (this.clearOnBlur) {
            this._inputEl.addEventListener('blur', () => {
                setTimeout(() => {
                    if (this._inputEl.value) {
                        this._inputEl.value = '';
                        this._closeDropdown();
                    }
                }, 150);
            });
        }

        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) this._closeDropdown();
        });
    }

    // ------------------------------------------------------------------
    // Search
    // ------------------------------------------------------------------
    async _search(query) {
        try {
            const results = await FA.searchPosts(this.postType, query);
            const filtered = results.filter(r => !this.selected.some(s => s.id === r.id));
            this._renderDropdown(filtered, query);
        } catch (err) {
            console.error('[RelationshipPicker] search error:', err);
        }
    }

    _renderDropdown(items, query = '') {
        this._dropdownEl.innerHTML = '';

        if (!items.length && !this.canCreate) {
            const li = document.createElement('li');
            li.className = 'fa-picker__empty';
            li.textContent = 'No results';
            this._dropdownEl.appendChild(li);
        }

        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'fa-picker__result';
            li.setAttribute('role', 'option');
            li.textContent = item.title?.rendered || item.title || '';
            li.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this._select({ id: item.id, title: li.textContent });
            });
            this._dropdownEl.appendChild(li);
        });

        // "Add" option when canCreate is enabled
        if (this.canCreate && this.onCreate && query) {
            const li = document.createElement('li');
            li.className = 'fa-picker__create';
            li.setAttribute('role', 'option');
            li.textContent = `+ Add "${query}"`;
            li.addEventListener('mousedown', async (e) => {
                e.preventDefault();
                if (this._creating) return;
                this._creating = true;
                li.textContent = 'Creating…';
                li.style.opacity = '0.6';
                try {
                    const item = await this.onCreate(query);
                    if (item) this._select(item);
                } catch (err) {
                    console.error('[RelationshipPicker] create error:', err);
                } finally {
                    this._creating = false;
                }
                this._closeDropdown();
            });
            this._dropdownEl.appendChild(li);
        }

        this._dropdownEl.hidden = false;
        this._inputEl.setAttribute('aria-expanded', 'true');
    }

    _closeDropdown() {
        this._dropdownEl.hidden = true;
        this._inputEl.setAttribute('aria-expanded', 'false');
    }

    // ------------------------------------------------------------------
    // Selection
    // ------------------------------------------------------------------
    _select(item) {
        if (this.max !== null && this.selected.length >= this.max) return;
        this.selected.push(item);
        this._inputEl.value = '';
        this._closeDropdown();
        this._renderTags();
        this._updateInputState();
    }

    deselect(id) {
        this.selected = this.selected.filter(s => s.id !== id);
        this._renderTags();
        this._updateInputState();
    }

    _updateInputState() {
        const atMax = this.max !== null && this.selected.length >= this.max;
        this._inputEl.disabled    = atMax;
        this._inputEl.placeholder = atMax
            ? `Maximum ${this.max} selected`
            : this.placeholder;
    }

    _renderTags() {
        if (!this.selected.length) {
            this._tagsEl.hidden = true;
            this._tagsEl.innerHTML = '';
            return;
        }

        this._tagsEl.hidden  = false;
        this._tagsEl.innerHTML = this.selected.map(s => `
            <span class="fa-picker__tag">
                ${this._esc(s.title)}
                <button type="button"
                        class="fa-picker__tag-remove"
                        data-id="${s.id}"
                        aria-label="Remove ${this._esc(s.title)}">&times;</button>
            </span>`).join('');

        this._tagsEl.querySelectorAll('.fa-picker__tag-remove').forEach(btn => {
            btn.addEventListener('click', () => this.deselect(parseInt(btn.dataset.id, 10)));
        });
    }

    _esc(str) {
        const d = document.createElement('span');
        d.textContent = str;
        return d.innerHTML;
    }

    // ------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------
    getValues() {
        return this.selected.map(s => s.id);
    }

    getSelected() {
        return [...this.selected];
    }

    setValues(items) {
        this.reset();
        items.forEach(item => this._select(item));
    }

    reset() {
        this.selected = [];
        this._inputEl.value = '';
        this._inputEl.disabled = false;
        this._inputEl.placeholder = this.placeholder;
        this._tagsEl.hidden = true;
        this._tagsEl.innerHTML = '';
        this._closeDropdown();
    }
}
