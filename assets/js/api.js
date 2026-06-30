/**
 * Family Archive — shared REST API wrapper
 *
 * All front-end fetch calls go through this module.
 * Auth: WP nonce injected via FA_CONFIG.nonce (cookie auth for logged-in users).
 * FA_CONFIG is localized by functions.php.
 */

const FA = (function () {

    const { apiBase, nonce, themeUri, siteUrl } = window.FA_CONFIG || {};

    // -------------------------------------------------------------------------
    // Core fetch wrapper
    // -------------------------------------------------------------------------
    async function request(endpoint, options = {}) {
        const url = endpoint.startsWith('http')
            ? endpoint
            : apiBase + endpoint.replace(/^\//, '');

        const headers = {
            'Content-Type': 'application/json',
            'X-WP-Nonce': nonce,
            ...(options.headers || {}),
        };

        const res = await fetch(url, {
            ...options,
            headers,
        });

        if (!res.ok) {
            let msg = `HTTP ${res.status}`;
            try {
                const err = await res.json();
                msg = err.message || msg;
            } catch (_) { /* ignore */ }
            throw new Error(msg);
        }

        const text = await res.text();
        return text ? JSON.parse(text) : null;
    }

    // -------------------------------------------------------------------------
    // CRUD helpers
    // -------------------------------------------------------------------------
    function get(endpoint, params = {}) {
        const qs = new URLSearchParams(params).toString();
        return request(qs ? `${endpoint}?${qs}` : endpoint);
    }

    function post(endpoint, data) {
        return request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    function put(endpoint, data) {
        return request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    function patch(endpoint, data) {
        return request(endpoint, {
            method: 'POST',
            body: JSON.stringify({ ...data, _method: 'PATCH' }),
        });
    }

    function del(endpoint) {
        return request(endpoint, { method: 'DELETE' });
    }

    // -------------------------------------------------------------------------
    // Post type helpers
    // -------------------------------------------------------------------------
    const postTypes = {
        person:   'fa_person',
        location: 'fa_location',
        event:    'fa_event',
        story:    'fa_story',
        media:    'fa_media',
    };

    function getRestBase(type) {
        return postTypes[type] || type;
    }

    function createPost(type, fields = {}, acfFields = {}) {
        return post(`wp/v2/${getRestBase(type)}`, {
            title:  fields.title || '',
            status: 'publish',
            acf:    acfFields,
            ...fields,
        });
    }

    function updatePost(type, id, fields = {}, acfFields = {}) {
        return post(`wp/v2/${getRestBase(type)}/${id}`, {
            acf: acfFields,
            ...fields,
        });
    }

    function getPost(type, id) {
        return get(`wp/v2/${getRestBase(type)}/${id}`);
    }

    function deletePost(type, id) {
        return del(`wp/v2/${getRestBase(type)}/${id}?force=true`);
    }

    // -------------------------------------------------------------------------
    // Search / list helpers
    // -------------------------------------------------------------------------
    function searchPosts(type, query, extra = {}) {
        return get(`wp/v2/${getRestBase(type)}`, {
            search:   query,
            per_page: 10,
            _fields:  'id,title,acf',
            ...extra,
        });
    }

    function listPosts(type, params = {}) {
        return get(`wp/v2/${getRestBase(type)}`, {
            per_page: 20,
            orderby:  'date',
            order:    'desc',
            ...params,
        });
    }

    // -------------------------------------------------------------------------
    // File / media upload
    // -------------------------------------------------------------------------
    async function uploadMedia(file, title = '') {
        const formData = new FormData();
        formData.append('file', file);
        if (title) formData.append('title', title);

        const res = await fetch(apiBase + 'wp/v2/media', {
            method: 'POST',
            headers: {
                'X-WP-Nonce': nonce,
                'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
            },
            body: formData,
        });

        if (!res.ok) {
            let msg = `Upload failed: HTTP ${res.status}`;
            try { const e = await res.json(); msg = e.message || msg; } catch (_) {}
            throw new Error(msg);
        }

        return res.json();
    }

    // -------------------------------------------------------------------------
    // UI helper — live search relationship picker
    // -------------------------------------------------------------------------
    function attachLiveSearch(inputEl, resultsEl, postType, onSelect) {
        let timer;

        inputEl.addEventListener('input', function () {
            clearTimeout(timer);
            const q = this.value.trim();
            if (q.length < 2) { resultsEl.innerHTML = ''; resultsEl.hidden = true; return; }

            timer = setTimeout(async () => {
                try {
                    const people = await searchPosts(postType, q);
                    renderResults(resultsEl, people, onSelect);
                } catch (e) {
                    console.error('Live search error:', e);
                }
            }, 250);
        });

        document.addEventListener('click', function (e) {
            if (!inputEl.contains(e.target) && !resultsEl.contains(e.target)) {
                resultsEl.hidden = true;
            }
        });
    }

    function renderResults(container, items, onSelect) {
        container.innerHTML = '';
        if (!items.length) {
            container.innerHTML = '<li class="fa-search-empty">No results</li>';
            container.hidden = false;
            return;
        }
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'fa-search-result';
            li.textContent = item.title?.rendered || item.title || '(no title)';
            li.dataset.id = item.id;
            li.addEventListener('mousedown', function (e) {
                e.preventDefault();
                onSelect(item);
                container.hidden = true;
            });
            container.appendChild(li);
        });
        container.hidden = false;
    }

    // -------------------------------------------------------------------------
    // UI helper — show notice
    // -------------------------------------------------------------------------
    function showNotice(container, message, type = 'success') {
        let el = container.querySelector('.fa-notice');
        if (!el) {
            el = document.createElement('div');
            container.prepend(el);
        }
        el.className = `fa-notice fa-notice--${type}`;
        el.textContent = message;
        el.hidden = false;
        if (type === 'success') {
            setTimeout(() => { el.hidden = true; }, 4000);
        }
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------
    return {
        request,
        get,
        post,
        put,
        patch,
        del,
        createPost,
        updatePost,
        getPost,
        deletePost,
        searchPosts,
        listPosts,
        uploadMedia,
        attachLiveSearch,
        showNotice,
        config: { apiBase, nonce, themeUri, siteUrl },
    };

}());

window.FA = FA;
