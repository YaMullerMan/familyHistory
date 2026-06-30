(async function () {

    const canvas  = document.getElementById('fa-map-canvas');
    const loading = document.getElementById('fa-map-loading');
    const empty   = document.getElementById('fa-map-empty');

    if (!canvas) return;

    // ── Type config (mirrors ACF location_type choices) ──────────────────────
    const TYPES = {
        birthplace:  { label: 'Birthplace',    color: '#3B6D11' },
        residence:   { label: 'Residence',     color: '#2563eb' },
        burial:      { label: 'Burial site',   color: '#6b7280' },
        reunion:     { label: 'Family reunion',color: '#d97706' },
        immigration: { label: 'Immigration',   color: '#7c3aed' },
        other:       { label: 'Location',      color: '#374151' },
    };

    // ── Init Leaflet map ──────────────────────────────────────────────────────
    // Start centred on the continental US; will fit to actual bounds once loaded
    const map = L.map(canvas, {
        zoomControl: true,
        scrollWheelZoom: true,
    }).setView([39.5, -98.35], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }).addTo(map);

    // ── Fetch all locations ───────────────────────────────────────────────────
    let locations;
    try {
        locations = await FA.listPosts('location', {
            per_page: 100,
            _fields:  'id,title,link,acf',
        });
    } catch (err) {
        console.error('Map: failed to load locations', err);
        loading.hidden = true;
        return;
    }

    loading.hidden = true;

    const withCoords = (locations || []).filter(l => l.acf?.lat && l.acf?.lng);

    if (!withCoords.length) {
        empty.hidden = false;
        return;
    }

    // ── Plot markers ──────────────────────────────────────────────────────────
    const markersByType = {};
    const bounds        = [];

    withCoords.forEach(loc => {
        const acf  = loc.acf || {};
        const type = acf.location_type || 'other';
        const cfg  = TYPES[type] || TYPES.other;
        const ll   = [parseFloat(acf.lat), parseFloat(acf.lng)];

        const marker = L.marker(ll, { icon: makeDivIcon(cfg.color, type) });

        // Build popup
        const name     = esc(loc.title?.rendered || '');
        const place    = [acf.city, acf.state_province].filter(Boolean).map(esc).join(', ');
        const typeHtml = `<span class="fa-map-popup__tag" style="background:${cfg.color}">${esc(cfg.label)}</span>`;
        const popup    = `
            <div class="fa-map-popup">
                ${typeHtml}
                <div class="fa-map-popup__name">${name}</div>
                ${place ? `<div class="fa-map-popup__place">${place}</div>` : ''}
                <a href="${esc(loc.link || '#')}" class="fa-map-popup__link">View details →</a>
            </div>`;

        marker.bindPopup(popup, { maxWidth: 220, className: 'fa-leaflet-popup' });
        marker.addTo(map);

        if (!markersByType[type]) markersByType[type] = [];
        markersByType[type].push(marker);
        bounds.push(ll);
    });

    // Fit map to all markers
    if (bounds.length) {
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 11 });
    }

    // ── Filter buttons ────────────────────────────────────────────────────────
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', function () {
            const type    = this.dataset.filter;
            const nowOn   = this.classList.toggle('fa-map-filter--active');
            const markers = markersByType[type] || [];

            this.setAttribute('aria-pressed', nowOn ? 'true' : 'false');

            markers.forEach(m => {
                if (nowOn) {
                    m.addTo(map);
                } else {
                    map.removeLayer(m);
                }
            });
        });
    });

    // ── Helpers ───────────────────────────────────────────────────────────────

    function makeDivIcon(color, type) {
        const letter = (type || 'o')[0].toUpperCase();
        return L.divIcon({
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
        });
    }

    function esc(s) {
        const el = document.createElement('span');
        el.textContent = String(s || '');
        return el.innerHTML;
    }

}());
