(function () {

    const editId = parseInt(
        document.getElementById('fa-person-form').dataset.editId || '0', 10
    );

    // Existing photo ID preserved when editing without re-uploading
    let existingPhotoId = null;

    // Previous relationship IDs captured during prefill; used to diff on save
    let prevRelationships = { parents: [], children: [], spouses: [], former_spouses: [] };

    // ----------------------------------------------------------------
    // Relationship pickers
    // ----------------------------------------------------------------
    const birthLocPicker = new RelationshipPicker(
        document.getElementById('birth-location-picker'),
        {
            postType: 'fa_location', max: 1, placeholder: 'City, State',
            canCreate: true, onCreate: (q) => createLocation(q, 'birthplace'),
        }
    );
    const immigrationLocPicker = new RelationshipPicker(
        document.getElementById('immigration-location-picker'),
        {
            postType: 'fa_location', max: 1, placeholder: 'Country or city of origin…',
            canCreate: true, onCreate: (q) => createLocation(q, 'immigration'),
        }
    );
    const deathLocPicker = new RelationshipPicker(
        document.getElementById('death-location-picker'),
        {
            postType: 'fa_location', max: 1, placeholder: 'City, State',
            canCreate: true, onCreate: (q) => createLocation(q, 'burial'),
        }
    );
    const parentsPicker = new RelationshipPicker(
        document.getElementById('parents-picker'),
        { postType: 'fa_person', max: 2, placeholder: 'Search people…', clearOnBlur: true }
    );
    const spousesPicker = new RelationshipPicker(
        document.getElementById('spouses-picker'),
        { postType: 'fa_person', placeholder: 'Search people…', clearOnBlur: true }
    );
    const formerSpousesPicker = new RelationshipPicker(
        document.getElementById('former-spouses-picker'),
        { postType: 'fa_person', placeholder: 'Search people…', clearOnBlur: true }
    );
    const childrenPicker = new RelationshipPicker(
        document.getElementById('children-picker'),
        { postType: 'fa_person', placeholder: 'Search people…', clearOnBlur: true }
    );

    // ----------------------------------------------------------------
    // File upload
    // ----------------------------------------------------------------
    const photoUpload = new FileUpload(
        document.getElementById('photo-dropzone'),
        {
            onUpload: () => {},
            onError:  (msg) => {
                const el = document.getElementById('photo-upload-error');
                el.textContent = msg;
                el.hidden = false;
            },
        }
    );

    // ----------------------------------------------------------------
    // Status toggles
    // ----------------------------------------------------------------
    const isLivingCheckbox   = document.getElementById('is_living');
    const deathSection       = document.getElementById('death-section');
    const isLivingLabel      = document.getElementById('is_living_label');
    const isImmigrantCheckbox  = document.getElementById('is_immigrant');
    const immigrationSection   = document.getElementById('immigration-section');
    const isDivorcedCheckbox   = document.getElementById('is_divorced');
    const formerSpousesField   = document.getElementById('former-spouses-field');

    function syncLivingState() {
        const living = isLivingCheckbox.checked;
        deathSection.hidden       = living;
        isLivingLabel.textContent = living ? 'Living' : 'Deceased';
    }
    isLivingCheckbox.addEventListener('change', syncLivingState);
    syncLivingState();

    function syncImmigrantState() {
        immigrationSection.hidden = !isImmigrantCheckbox.checked;
    }
    isImmigrantCheckbox.addEventListener('change', syncImmigrantState);
    syncImmigrantState();

    function syncDivorcedState() {
        formerSpousesField.hidden = !isDivorcedCheckbox.checked;
    }
    isDivorcedCheckbox.addEventListener('change', syncDivorcedState);
    syncDivorcedState();

    // ----------------------------------------------------------------
    // Load existing family branches for datalist
    // ----------------------------------------------------------------
    FA.get('wp/v2/fa_branch', { per_page: 100 }).then(terms => {
        const list = document.getElementById('branch-datalist');
        terms.forEach(t => {
            const opt   = document.createElement('option');
            opt.value   = t.name;
            list.appendChild(opt);
        });
    }).catch(() => { /* non-critical */ });

    // ----------------------------------------------------------------
    // Multi-step form
    // ----------------------------------------------------------------
    new MultiStepForm({
        formEl:      document.getElementById('fa-person-form'),
        submitLabel: 'Save person',
        steps: [
            {
                label: 'Basic info',
                validate() {
                    const first = document.getElementById('first_name').value.trim();
                    const last  = document.getElementById('last_name').value.trim();
                    if (!first) return 'First name is required.';
                    if (!last)  return 'Last name is required.';
                },
                collect() {
                    return {
                        first_name:      document.getElementById('first_name').value.trim(),
                        middle_name:     document.getElementById('middle_name').value.trim(),
                        last_name:       document.getElementById('last_name').value.trim(),
                        maiden_name:     document.getElementById('maiden_name').value.trim(),
                        is_living:       isLivingCheckbox.checked,
                        is_immigrant:    isImmigrantCheckbox.checked,
                        is_divorced:     isDivorcedCheckbox.checked,
                        birth_date:      document.getElementById('birth_date').value,
                        birth_location:        birthLocPicker.getValues(),
                        immigration_location:  immigrationLocPicker.getValues(),
                        death_date:            document.getElementById('death_date').value,
                        death_location:        deathLocPicker.getValues(),
                        _birthLocLabels:       birthLocPicker.getSelected(),
                        _immigrationLocLabels: immigrationLocPicker.getSelected(),
                        _deathLocLabels:       deathLocPicker.getSelected(),
                        current_address: document.getElementById('current_address').value.trim(),
                        current_city:    document.getElementById('current_city').value.trim(),
                        current_state:   document.getElementById('current_state').value.trim(),
                        current_zip:     document.getElementById('current_zip').value.trim(),
                    };
                },
            },
            {
                label: 'Relationships',
                collect() {
                    return {
                        parents:              parentsPicker.getValues(),
                        spouses:              spousesPicker.getValues(),
                        former_spouses:       formerSpousesPicker.getValues(),
                        children:             childrenPicker.getValues(),
                        _parentsLabels:       parentsPicker.getSelected(),
                        _spousesLabels:       spousesPicker.getSelected(),
                        _formerSpousesLabels: formerSpousesPicker.getSelected(),
                        _childrenLabels:      childrenPicker.getSelected(),
                    };
                },
            },
            {
                label: 'Photo',
                validate() {
                    if (photoUpload.isUploading()) {
                        return 'Please wait for the photo upload to finish.';
                    }
                },
                collect() {
                    return {
                        profile_photo: photoUpload.getMediaId(),
                        _photoUrl:     photoUpload.getPreviewUrl(),
                    };
                },
            },
            {
                label: 'Bio',
                collect() {
                    return {
                        bio:           document.getElementById('bio').value.trim(),
                        family_branch: document.getElementById('family_branch').value.trim(),
                    };
                },
            },
            {
                label: 'Review',
            },
        ],
        onStepChange(stepIndex, data) {
            if (stepIndex === 4) renderReview(data);
        },
        async onComplete(data) {
            await submitPerson(data);
        },
    });

    // ----------------------------------------------------------------
    // Edit mode — pre-fill form with existing person data
    // ----------------------------------------------------------------
    if (editId) {
        prefillForm(editId);
    }

    async function fetchTitles(postType, ids) {
        if (!ids || !ids.length) return [];
        const posts = await Promise.all(
            ids.map(id => FA.getPost(postType, id).catch(() => null))
        );
        return posts.filter(Boolean).map(p => ({
            id:    p.id,
            title: p.title?.rendered || p.title || '(unknown)',
        }));
    }

    async function prefillForm(id) {
        try {
            const person = await FA.getPost('person', id);
            const acf    = person.acf || {};

            // Fetch related post titles in parallel
            const [birthLocs, deathLocs, immigLocs, parents, spouses, formerSpouses, children] =
                await Promise.all([
                    fetchTitles('location', acf.birth_location        || []),
                    fetchTitles('location', acf.death_location        || []),
                    fetchTitles('location', acf.immigration_location  || []),
                    fetchTitles('person',   acf.parents               || []),
                    fetchTitles('person',   acf.spouses               || []),
                    fetchTitles('person',   acf.former_spouses        || []),
                    fetchTitles('person',   acf.children              || []),
                ]);

            // Fetch family branch name from taxonomy
            let branchName = '';
            if (person.fa_branch && person.fa_branch.length) {
                try {
                    const term = await FA.get(`wp/v2/fa_branch/${person.fa_branch[0]}`);
                    branchName = term.name || '';
                } catch (_) {}
            }

            // Text inputs
            document.getElementById('first_name').value    = acf.first_name    || '';
            document.getElementById('middle_name').value   = acf.middle_name   || '';
            document.getElementById('last_name').value     = acf.last_name     || '';
            document.getElementById('maiden_name').value   = acf.maiden_name   || '';
            document.getElementById('birth_date').value    = acf.birth_date    || '';
            document.getElementById('death_date').value    = acf.death_date    || '';
            document.getElementById('current_address').value = acf.current_address || '';
            document.getElementById('current_city').value    = acf.current_city    || '';
            document.getElementById('current_state').value   = acf.current_state   || '';
            document.getElementById('current_zip').value     = acf.current_zip     || '';
            document.getElementById('bio').value           = htmlToPlainText(acf.bio || '');
            document.getElementById('family_branch').value = branchName;

            // Toggles
            isLivingCheckbox.checked   = !!acf.is_living;
            isImmigrantCheckbox.checked = !!acf.is_immigrant;
            syncLivingState();
            syncImmigrantState();

            // Capture previous relationship IDs for bidirectional sync on save
            prevRelationships = {
                parents:        (acf.parents        || []).map(Number),
                children:       (acf.children       || []).map(Number),
                spouses:        (acf.spouses        || []).map(Number),
                former_spouses: (acf.former_spouses || []).map(Number),
            };

            // Toggles
            isDivorcedCheckbox.checked = !!acf.is_divorced;
            syncDivorcedState();

            // Relationship pickers
            birthLocPicker.setValues(birthLocs);
            deathLocPicker.setValues(deathLocs);
            immigrationLocPicker.setValues(immigLocs);
            parentsPicker.setValues(parents);
            spousesPicker.setValues(spouses);
            formerSpousesPicker.setValues(formerSpouses);
            childrenPicker.setValues(children);

            // Profile photo
            if (acf.profile_photo && acf.profile_photo.id) {
                const url = acf.profile_photo.sizes?.medium || acf.profile_photo.url;
                photoUpload.setExisting(acf.profile_photo.id, url);
                existingPhotoId = acf.profile_photo.id;
            }

        } catch (err) {
            console.error('Edit prefill failed:', err);
        }
    }

    // ----------------------------------------------------------------
    // Review summary
    // ----------------------------------------------------------------
    function fmtDate(str) {
        if (!str) return null;
        const [y, m, d] = str.split('-');
        const months = ['January','February','March','April','May','June',
                        'July','August','September','October','November','December'];
        return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
    }

    function esc(s) {
        const el = document.createElement('span');
        el.textContent = String(s);
        return el.innerHTML;
    }

    function renderReview(data) {
        const fullName = [data.first_name, data.middle_name, data.last_name]
            .filter(Boolean).join(' ')
            + (data.maiden_name ? ` (née ${data.maiden_name})` : '');

        const rows = [
            { label: 'Full name',      value: fullName },
            { label: 'Status',         value: data.is_living ? 'Living' : 'Deceased' },
            { label: 'Born',           value: fmtDate(data.birth_date) },
            { label: 'Birthplace',     value: data._birthLocLabels?.[0]?.title || null },
            { label: 'Immigrated from', value: data._immigrationLocLabels?.[0]?.title || null },
            { label: 'Died',           value: !data.is_living ? fmtDate(data.death_date) : null },
            { label: 'Burial location', value: !data.is_living ? (data._deathLocLabels?.[0]?.title || null) : null },
            { label: 'Parents',        value: data._parentsLabels?.length  ? data._parentsLabels.map(p => p.title).join(', ')  : null },
            { label: 'Spouses',        value: data._spousesLabels?.length       ? data._spousesLabels.map(p => p.title).join(', ')       : null },
            { label: 'Former spouses', value: data._formerSpousesLabels?.length ? data._formerSpousesLabels.map(p => p.title).join(', ') : null },
            { label: 'Children',       value: data._childrenLabels?.length ? data._childrenLabels.map(p => p.title).join(', ') : null },
            { label: 'Family branch',  value: data.family_branch || null },
            {
                label: 'Current address',
                value: [data.current_address, data.current_city,
                        data.current_state, data.current_zip].filter(Boolean).join(', ') || null,
            },
            { label: 'Bio',            value: data.bio ? data.bio.substring(0, 140) + (data.bio.length > 140 ? '…' : '') : null },
            {
                label: 'Photo',
                value: data._photoUrl
                    ? `<img src="${esc(data._photoUrl)}" class="fa-review__photo" alt="Profile photo">`
                    : null,
                html: true,
            },
        ].filter(r => r.value !== null && r.value !== '');

        document.getElementById('fa-review-summary').innerHTML = rows.map(r => `
            <div class="fa-review__row">
                <span class="fa-review__label">${esc(r.label)}</span>
                <span class="fa-review__value">${r.html ? r.value : esc(r.value)}</span>
            </div>`).join('');
    }

    // ----------------------------------------------------------------
    // HTML → plain text (for pre-filling bio textarea)
    // ----------------------------------------------------------------
    function htmlToPlainText(html) {
        if (!html) return '';
        const s = html
            .replace(/<\/p>\s*<p>/gi, '\n\n')
            .replace(/<p>/gi, '')
            .replace(/<\/p>/gi, '')
            .replace(/<br\s*\/?>/gi, '\n');
        const div = document.createElement('div');
        div.innerHTML = s;
        return div.textContent.trim();
    }

    // ----------------------------------------------------------------
    // Inline location creation — used by canCreate pickers
    // ----------------------------------------------------------------
    async function createLocation(query, locationType) {
        const [rawCity, rawState] = query.split(',').map(s => s.trim());
        const coords = await geocodeAddress('', rawCity, rawState || '', '');
        const loc = await FA.createPost('location',
            { title: query },
            {
                city:           rawCity,
                state_province: rawState || '',
                country:        '',
                location_type:  locationType,
                lat:            coords ? coords.lat : '',
                lng:            coords ? coords.lng : '',
            }
        );
        return { id: loc.id, title: loc.title?.rendered || query };
    }

    // ----------------------------------------------------------------
    // Geocoding — Nominatim (free, no key, 1 req/sec limit is fine here)
    // ----------------------------------------------------------------
    async function geocodeAddress(address, city, state, zip) {
        const parts = [address, city, state, zip].filter(Boolean);
        if (!parts.length) return null;
        try {
            const q   = encodeURIComponent(parts.join(', ') + ', US');
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${q}`,
                { headers: { 'Accept-Language': 'en-US' } }
            );
            const data = await res.json();
            if (data.length) {
                return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            }
        } catch (_) { /* non-critical — map pin just won't appear until re-saved */ }
        return null;
    }

    // ----------------------------------------------------------------
    // Submission
    // ----------------------------------------------------------------
    async function submitPerson(data) {
        const successEl  = document.getElementById('fa-submit-success');
        const isEditing  = editId > 0;

        // Resolve or create the family branch term
        let branchIds = [];
        if (data.family_branch) {
            try {
                const existing = await FA.get('wp/v2/fa_branch', {
                    search: data.family_branch, per_page: 5,
                });
                const match = existing.find(
                    t => t.name.toLowerCase() === data.family_branch.toLowerCase()
                );
                branchIds = match
                    ? [match.id]
                    : [(await FA.post('wp/v2/fa_branch', { name: data.family_branch })).id];
            } catch (_) { /* non-critical */ }
        }

        const titleParts = [data.first_name, data.middle_name, data.last_name].filter(Boolean);

        // Geocode current address if provided (non-blocking on failure)
        let coords = null;
        if (data.current_address || data.current_city) {
            coords = await geocodeAddress(
                data.current_address, data.current_city,
                data.current_state,   data.current_zip
            );
        }

        const titleStr = titleParts.join(' ');
        const postFields = { title: titleStr, fa_branch: branchIds };

        // When editing, merge existing relationship IDs with any newly selected ones.
        // This ensures a partially-prefilled picker can never erase existing links.
        // Removal of relationships requires editing the other person's profile or wp-admin.
        const mergeIds = (prev, next) =>
            isEditing ? [...new Set([...prev, ...(next || []).map(Number)])] : (next || []);

        const acfFields  = {
            first_name:           data.first_name,
            middle_name:          data.middle_name           || '',
            last_name:            data.last_name,
            maiden_name:          data.maiden_name           || '',
            is_living:            data.is_living    ? 1 : 0,
            is_immigrant:         data.is_immigrant ? 1 : 0,
            is_divorced:          data.is_divorced  ? 1 : 0,
            birth_date:           data.birth_date            || '',
            birth_location:       data.birth_location        || [],
            immigration_location: data.immigration_location  || [],
            death_date:           data.death_date            || '',
            death_location:       data.death_location        || [],
            parents:              mergeIds(prevRelationships.parents,        data.parents),
            spouses:              mergeIds(prevRelationships.spouses,        data.spouses),
            former_spouses:       mergeIds(prevRelationships.former_spouses, data.former_spouses),
            children:             mergeIds(prevRelationships.children,       data.children),
            bio:                  data.bio                   || '',
            profile_photo:        data.profile_photo         || existingPhotoId || '',
            current_address:      data.current_address       || '',
            current_city:         data.current_city          || '',
            current_state:        data.current_state         || '',
            current_zip:          data.current_zip           || '',
            current_lat:          coords ? coords.lat        : '',
            current_lng:          coords ? coords.lng        : '',
        };

        const result = isEditing
            ? await FA.updatePost('person', editId, postFields, acfFields)
            : await FA.createPost('person', postFields, acfFields);

        // Write reverse relationship links on all affected people
        await syncRelationships(
            result.id,
            { parents: acfFields.parents, children: acfFields.children, spouses: acfFields.spouses, former_spouses: acfFields.former_spouses },
            isEditing ? prevRelationships : { parents: [], children: [], spouses: [], former_spouses: [] }
        );

        document.getElementById('fa-form-nav').hidden = true;

        const name = result.title?.rendered || titleStr;
        successEl.innerHTML = isEditing
            ? `<strong>${esc(name)}</strong> has been updated.<br><br>
               <a href="${esc(result.link)}" class="fa-btn fa-btn--primary fa-btn--sm">View profile</a>`
            : `<strong>${esc(name)}</strong> has been added to the archive.<br><br>
               <a href="${esc(result.link)}" class="fa-btn fa-btn--primary fa-btn--sm">View profile</a>
               &nbsp;
               <a href="" id="fa-add-another" class="fa-btn fa-btn--secondary fa-btn--sm">Add another person</a>`;
        successEl.hidden = false;

        if (!isEditing) {
            document.getElementById('fa-add-another').addEventListener('click', (e) => {
                e.preventDefault();
                window.location.reload();
            });
        }
    }

    // ----------------------------------------------------------------
    // Bidirectional relationship sync
    // Ensures that when person A lists B as a parent, B also lists A as a child, etc.
    // ----------------------------------------------------------------
    async function syncRelationships(personId, next, prev) {
        const id = Number(personId);

        const nextParents        = next.parents.map(Number);
        const nextChildren       = next.children.map(Number);
        const nextSpouses        = next.spouses.map(Number);
        const nextFormerSpouses  = next.former_spouses.map(Number);
        const removed = field => (prev[field] || []).filter(x => !(next[field] || []).map(Number).includes(x));

        const tasks = [];

        // Fetch related person, add or remove this personId, only write if changed
        const patch = (relatedId, field, addId, removeId) =>
            FA.getPost('person', relatedId).then(post => {
                let ids = (post.acf?.[field] || []).map(Number);
                const before = ids.slice().sort().join(',');
                if (addId    !== undefined && !ids.includes(addId))  ids = [...ids, addId];
                if (removeId !== undefined)                           ids = ids.filter(x => x !== removeId);
                const after = ids.slice().sort().join(',');
                if (before === after) return; // already correct, skip the write
                return FA.updatePost('person', relatedId, {}, { [field]: ids });
            }).catch(() => {});

        // Ensure ALL current parents have this person in their children
        nextParents.forEach(pid  => tasks.push(patch(pid, 'children', id, undefined)));
        removed('parents').forEach(pid => tasks.push(patch(pid, 'children', undefined, id)));

        // Ensure ALL current children have this person in their parents
        nextChildren.forEach(cid  => tasks.push(patch(cid, 'parents', id, undefined)));
        removed('children').forEach(cid => tasks.push(patch(cid, 'parents', undefined, id)));

        // Ensure ALL current spouses have this person in their spouses
        nextSpouses.forEach(sid  => tasks.push(patch(sid, 'spouses', id, undefined)));
        removed('spouses').forEach(sid => tasks.push(patch(sid, 'spouses', undefined, id)));

        // Ensure ALL current former spouses have this person in their former_spouses
        nextFormerSpouses.forEach(sid  => tasks.push(patch(sid, 'former_spouses', id, undefined)));
        removed('former_spouses').forEach(sid => tasks.push(patch(sid, 'former_spouses', undefined, id)));

        await Promise.all(tasks);
    }

}());
