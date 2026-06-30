(async function () {

    const canvas  = document.getElementById('fa-map-canvas');
    const loading = document.getElementById('fa-map-loading');
    const empty   = document.getElementById('fa-map-empty');

    if (!canvas) return;

    // ── Type config ───────────────────────────────────────────────────────────
    const TYPES = {
        birthplace:  { label: 'Birthplace',  color: '#3B6D11' },
        residence:   { label: 'Residence',   color: '#2563eb' },
        immigration: { label: 'Immigration', color: '#7c3aed' },
    };

    // ── Init Leaflet map ──────────────────────────────────────────────────────
    const map = L.map(canvas, {
        zoomControl:      true,
        scrollWheelZoom:  true,
    }).setView([39.5, -98.35], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }).addTo(map);

    // ── Fetch locations (coord lookup) and people in parallel ─────────────────
    let locations, people;
    try {
        [locations, people] = await Promise.all([
            FA.listPosts('location', { per_page: 100, _fields: 'id,title,acf' }),
            FA.listPosts('person',   { per_page: 100, _fields: 'id,title,link,acf' }),
        ]);
    } catch (err) {
        console.error('Map: failed to load data', err);
        loading.hidden = true;
        return;
    }

    loading.hidden = true;

    // Build location lookup: id → location post
    const locById = {};
    (locations || []).forEach(loc => { locById[loc.id] = loc; });

    // ── Auto-geocode location posts that are missing coordinates ─────────────
    // Runs in the background — doesn't block map render.
    (async function geocodeLocations() {
        const needsGeocode = Object.values(locById).filter(
            l => !(l.acf?.lat && l.acf?.lng) && (l.acf?.city || l.acf?.address)
        );
        for (const loc of needsGeocode) {
            const a = loc.acf || {};
            const parts = [a.address, a.city, a.state_province, a.country].filter(Boolean);
            if (!parts.length) continue;
            try {
                const q   = encodeURIComponent(parts.join(', '));
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`,
                    { headers: { 'Accept-Language': 'en-US' } }
                );
                const data = await res.json();
                if (data.length) {
                    const lat = parseFloat(data[0].lat);
                    const lng = parseFloat(data[0].lon);
                    loc.acf   = { ...loc.acf, lat, lng };
                    FA.post(`wp/v2/fa_location/${loc.id}`, { acf: { lat, lng } }).catch(() => {});
                }
            } catch (_) { /* non-critical */ }
            await new Promise(r => setTimeout(r, 1100));
        }
    }());

    // ── Plot markers ──────────────────────────────────────────────────────────
    // Which types are visible on initial load (driven by PHP template)
    const activeOnLoad = new Set(
        [...document.querySelectorAll('[data-filter].fa-map-filter--active')]
            .map(b => b.dataset.filter)
    );

    const markersByType = { birthplace: [], residence: [], immigration: [] };
    const bounds        = [];

    function addResidenceMarker(person, lat, lng) {
        const acf   = person.acf || {};
        const name  = esc(person.title?.rendered || '');
        const href  = esc(person.link || '#');
        const place = [acf.current_city, acf.current_state].filter(Boolean).map(esc).join(', ');
        const ll    = [lat, lng];
        const marker = makeMarker(ll, 'residence');
        marker.bindPopup(popup('Residence', TYPES.residence.color, name, place, href, 'View profile →'),
            { maxWidth: 240, className: 'fa-leaflet-popup' });
        if (activeOnLoad.has('residence')) marker.addTo(map);
        markersByType.residence.push(marker);
        bounds.push(ll);
        if (empty.hidden === false) empty.hidden = true;
    }

    (people || []).forEach(person => {
        const acf  = person.acf || {};
        const name = esc(person.title?.rendered || '');
        const href = esc(person.link || '#');

        // ── Birthplace pin ─────────────────────────────────────────────────
        const birthLocIds = Array.isArray(acf.birth_location) ? acf.birth_location : [];
        if (birthLocIds.length) {
            const loc = locById[birthLocIds[0]];
            if (loc?.acf?.lat && loc?.acf?.lng) {
                const ll    = [parseFloat(loc.acf.lat), parseFloat(loc.acf.lng)];
                const place = [loc.acf.city, loc.acf.state_province]
                    .filter(Boolean).map(esc).join(', ');
                const marker = makeMarker(ll, 'birthplace');
                marker.bindPopup(popup('Birthplace', TYPES.birthplace.color, name, place, href, 'View profile →'),
                    { maxWidth: 240, className: 'fa-leaflet-popup' });
                if (activeOnLoad.has('birthplace')) marker.addTo(map);
                markersByType.birthplace.push(marker);
                bounds.push(ll);
            }
        }

        // ── Immigration pin ────────────────────────────────────────────────
        const immigLocIds = Array.isArray(acf.immigration_location) ? acf.immigration_location : [];
        if (immigLocIds.length) {
            const loc = locById[immigLocIds[0]];
            if (loc?.acf?.lat && loc?.acf?.lng) {
                const ll    = [parseFloat(loc.acf.lat), parseFloat(loc.acf.lng)];
                const place = [loc.acf.city, loc.acf.state_province, loc.acf.country]
                    .filter(Boolean).map(esc).join(', ');
                const marker = makeMarker(ll, 'immigration');
                marker.bindPopup(popup('Immigration', TYPES.immigration.color, name, place, href, 'View profile →'),
                    { maxWidth: 240, className: 'fa-leaflet-popup' });
                if (activeOnLoad.has('immigration')) marker.addTo(map);
                markersByType.immigration.push(marker);
                bounds.push(ll);
            }
        }

        // ── Residence pin — plot immediately if coords already saved ───────
        const lat = parseFloat(acf.current_lat);
        const lng = parseFloat(acf.current_lng);
        if (lat && lng) {
            addResidenceMarker(person, lat, lng);
        }
    });

    if (!bounds.length) {
        empty.hidden = false;
    }

    // ── Geocode missing residence coordinates in the background ───────────────
    // People who have an address but no stored coordinates get geocoded once;
    // their pin appears as soon as Nominatim responds, and coords are saved back.
    (async function geocodeResidences() {
        const needsGeocode = (people || []).filter(
            p => !(parseFloat(p.acf?.current_lat) && parseFloat(p.acf?.current_lng)) &&
                 (p.acf?.current_city || p.acf?.current_address)
        );
        for (const person of needsGeocode) {
            const a     = person.acf || {};
            const parts = [a.current_address, a.current_city, a.current_state, a.current_zip]
                .filter(Boolean);
            if (!parts.length) continue;
            try {
                const nominatim = async q => {
                    const r = await fetch(
                        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(q)}`,
                        { headers: { 'Accept-Language': 'en-US' } }
                    );
                    return r.json();
                };

                let geo = await nominatim(parts.join(', '));

                // Street-level geocoding often fails without a state; retry city-only
                if (!geo.length) {
                    const cityParts = [a.current_city, a.current_state, a.current_zip].filter(Boolean);
                    if (cityParts.length) {
                        await new Promise(r => setTimeout(r, 1100));
                        geo = await nominatim(cityParts.join(', '));
                    }
                }

                if (geo.length) {
                    const lat = parseFloat(geo[0].lat);
                    const lng = parseFloat(geo[0].lon);
                    addResidenceMarker(person, lat, lng);
                    FA.post(`wp/v2/fa_person/${person.id}`,
                        { acf: { current_lat: lat, current_lng: lng } }).catch(() => {});
                }
            } catch (_) { /* non-critical */ }
            await new Promise(r => setTimeout(r, 1100));
        }
    }());

    // ── Filter buttons ────────────────────────────────────────────────────────
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', function () {
            const type  = this.dataset.filter;
            const nowOn = this.classList.toggle('fa-map-filter--active');
            this.setAttribute('aria-pressed', nowOn ? 'true' : 'false');
            (markersByType[type] || []).forEach(m => nowOn ? m.addTo(map) : map.removeLayer(m));
        });
    });

    // ── Helpers ───────────────────────────────────────────────────────────────

    function makeMarker(ll, type) {
        const { color } = TYPES[type] || { color: '#374151' };
        const letter    = type[0].toUpperCase();
        return L.marker(ll, {
            icon: L.divIcon({
                className: '',
                html: `<svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 24 14 24S28 24.5 28 14C28 6.27 21.73 0 14 0z"
                          fill="${color}"/>
                    <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
                    <text x="14" y="18" text-anchor="middle"
                          font-family="system-ui,sans-serif" font-size="8"
                          font-weight="700" fill="${color}">${letter}</text>
                </svg>`,
                iconSize:    [28, 38],
                iconAnchor:  [14, 38],
                popupAnchor: [0, -40],
            }),
        });
    }

    function popup(typeLabel, color, name, place, href, linkText) {
        return `<div class="fa-map-popup">
            <span class="fa-map-popup__tag" style="background:${color}">${esc(typeLabel)}</span>
            <div class="fa-map-popup__name">${name}</div>
            ${place ? `<div class="fa-map-popup__place">${place}</div>` : ''}
            <a href="${href}" class="fa-map-popup__link">${esc(linkText)}</a>
        </div>`;
    }

    function esc(s) {
        const el = document.createElement('span');
        el.textContent = String(s || '');
        return el.innerHTML;
    }

}());
