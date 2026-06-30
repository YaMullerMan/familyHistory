(function () {

    // ----------------------------------------------------------------
    // Relationship pickers
    // ----------------------------------------------------------------
    const birthLocPicker = new RelationshipPicker(
        document.getElementById('birth-location-picker'),
        { postType: 'fa_location', max: 1, placeholder: 'Search locations…' }
    );
    const deathLocPicker = new RelationshipPicker(
        document.getElementById('death-location-picker'),
        { postType: 'fa_location', max: 1, placeholder: 'Search locations…' }
    );
    const parentsPicker = new RelationshipPicker(
        document.getElementById('parents-picker'),
        { postType: 'fa_person', max: 2, placeholder: 'Search people…' }
    );
    const spousesPicker = new RelationshipPicker(
        document.getElementById('spouses-picker'),
        { postType: 'fa_person', placeholder: 'Search people…' }
    );
    const childrenPicker = new RelationshipPicker(
        document.getElementById('children-picker'),
        { postType: 'fa_person', placeholder: 'Search people…' }
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
    // Is living toggle
    // ----------------------------------------------------------------
    const isLivingCheckbox = document.getElementById('is_living');
    const deathSection     = document.getElementById('death-section');
    const isLivingLabel    = document.getElementById('is_living_label');

    function syncLivingState() {
        const living = isLivingCheckbox.checked;
        deathSection.hidden       = living;
        isLivingLabel.textContent = living ? 'Living' : 'Deceased';
    }
    isLivingCheckbox.addEventListener('change', syncLivingState);
    syncLivingState();

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
                        birth_date:      document.getElementById('birth_date').value,
                        birth_location:  birthLocPicker.getValues(),
                        death_date:      document.getElementById('death_date').value,
                        death_location:  deathLocPicker.getValues(),
                        _birthLocLabels: birthLocPicker.getSelected(),
                        _deathLocLabels: deathLocPicker.getSelected(),
                    };
                },
            },
            {
                label: 'Relationships',
                collect() {
                    return {
                        parents:         parentsPicker.getValues(),
                        spouses:         spousesPicker.getValues(),
                        children:        childrenPicker.getValues(),
                        _parentsLabels:  parentsPicker.getSelected(),
                        _spousesLabels:  spousesPicker.getSelected(),
                        _childrenLabels: childrenPicker.getSelected(),
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
            { label: 'Died',           value: !data.is_living ? fmtDate(data.death_date) : null },
            { label: 'Death location', value: !data.is_living ? (data._deathLocLabels?.[0]?.title || null) : null },
            { label: 'Parents',        value: data._parentsLabels?.length  ? data._parentsLabels.map(p => p.title).join(', ')  : null },
            { label: 'Spouses',        value: data._spousesLabels?.length  ? data._spousesLabels.map(p => p.title).join(', ')  : null },
            { label: 'Children',       value: data._childrenLabels?.length ? data._childrenLabels.map(p => p.title).join(', ') : null },
            { label: 'Family branch',  value: data.family_branch || null },
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
    // Submission
    // ----------------------------------------------------------------
    async function submitPerson(data) {
        const successEl = document.getElementById('fa-submit-success');

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

        const result = await FA.createPost(
            'person',
            {
                title:     titleParts.join(' '),
                fa_branch: branchIds,
            },
            {
                first_name:     data.first_name,
                middle_name:    data.middle_name    || '',
                last_name:      data.last_name,
                maiden_name:    data.maiden_name    || '',
                is_living:      data.is_living ? 1 : 0,
                birth_date:     data.birth_date     || '',
                birth_location: data.birth_location || [],
                death_date:     data.death_date     || '',
                death_location: data.death_location || [],
                parents:        data.parents        || [],
                spouses:        data.spouses        || [],
                children:       data.children       || [],
                bio:            data.bio            || '',
                profile_photo:  data.profile_photo  || '',
            }
        );

        document.getElementById('fa-form-nav').hidden = true;

        const name = result.title?.rendered || titleParts.join(' ');
        successEl.innerHTML = `
            <strong>${esc(name)}</strong> has been added to the archive.<br><br>
            <a href="${esc(result.link)}" class="fa-btn fa-btn--primary fa-btn--sm">View profile</a>
            &nbsp;
            <a href="" id="fa-add-another" class="fa-btn fa-btn--secondary fa-btn--sm">Add another person</a>
        `;
        successEl.hidden = false;

        document.getElementById('fa-add-another').addEventListener('click', (e) => {
            e.preventDefault();
            window.location.reload();
        });
    }

}());
