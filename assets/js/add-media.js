(function () {

    // ── Relationship pickers ──────────────────────────────────────────────────

    const peoplePicker = new RelationshipPicker(
        document.getElementById('people-picker'),
        { postType: 'fa_person', placeholder: 'Search people…' }
    );

    const locationPicker = new RelationshipPicker(
        document.getElementById('location-picker'),
        { postType: 'fa_location', max: 1, placeholder: 'Search locations…' }
    );

    const eventPicker = new RelationshipPicker(
        document.getElementById('event-picker'),
        { postType: 'fa_event', max: 1, placeholder: 'Search events…' }
    );

    // ── Photo upload (FileUpload component) ───────────────────────────────────

    const photoUpload = new FileUpload(
        document.getElementById('photo-dropzone'),
        {
            onUpload: () => {},
            onError: (msg) => {
                const el = document.getElementById('photo-upload-error');
                el.textContent = msg;
                el.hidden = false;
            },
        }
    );

    // ── File attachment (plain file input, manual upload) ─────────────────────

    let attachedFileId = null;

    const fileInput      = document.getElementById('media_file_input');
    const filePreview    = document.getElementById('fa-file-attach-preview');
    const fileName       = document.getElementById('fa-file-attach-name');
    const fileRemoveBtn  = document.getElementById('fa-file-attach-remove');
    const fileUploading  = document.getElementById('fa-file-attach-uploading');
    const fileError      = document.getElementById('fa-file-attach-error');
    const fileLabel      = document.querySelector('.fa-file-attach__label');

    fileInput.addEventListener('change', async function () {
        const file = this.files[0];
        if (!file) return;

        fileError.hidden    = true;
        fileUploading.hidden = false;
        fileLabel.style.display = 'none';

        try {
            const media   = await FA.uploadMedia(file);
            attachedFileId = media.id;
            fileName.textContent  = file.name;
            filePreview.hidden    = false;
            fileUploading.hidden  = true;
        } catch (err) {
            fileError.textContent = err.message || 'File upload failed. Please try again.';
            fileError.hidden      = false;
            fileUploading.hidden  = true;
            fileLabel.style.display = '';
            this.value = '';
        }
    });

    fileRemoveBtn.addEventListener('click', () => {
        attachedFileId     = null;
        fileInput.value    = '';
        filePreview.hidden = true;
        fileLabel.style.display = '';
    });

    // ── Media type picker (taxonomy) ──────────────────────────────────────────

    let selectedTypeId   = null;
    let selectedTypeName = null;

    const pillsContainer = document.getElementById('fa-type-pills');
    const typeNewSection = document.getElementById('fa-type-new');
    const typeNewInput   = document.getElementById('fa-type-new-input');
    const typeNewSave    = document.getElementById('fa-type-new-save');
    const typeNewCancel  = document.getElementById('fa-type-new-cancel');
    const typeAddBtn     = document.getElementById('fa-type-add-btn');

    async function loadTypePills() {
        try {
            const terms = await FA.get('wp/v2/fa_media_type', { per_page: 100, orderby: 'name', order: 'asc' });
            renderPills(terms);
        } catch (_) {}
    }

    function renderPills(terms) {
        pillsContainer.innerHTML = '';
        terms.forEach(term => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'fa-type-pill';
            btn.textContent = term.name;
            btn.dataset.id  = term.id;
            btn.dataset.name = term.name;
            if (term.id === selectedTypeId) btn.classList.add('fa-type-pill--active');
            btn.addEventListener('click', () => selectType(term.id, term.name, btn));
            pillsContainer.appendChild(btn);
        });
    }

    function selectType(id, name, btnEl) {
        selectedTypeId   = id;
        selectedTypeName = name;
        pillsContainer.querySelectorAll('.fa-type-pill').forEach(b => b.classList.remove('fa-type-pill--active'));
        btnEl?.classList.add('fa-type-pill--active');
    }

    typeAddBtn.addEventListener('click', () => {
        typeNewSection.hidden = false;
        typeAddBtn.hidden     = true;
        typeNewInput.focus();
    });

    typeNewCancel.addEventListener('click', () => {
        typeNewSection.hidden = true;
        typeAddBtn.hidden     = false;
        typeNewInput.value    = '';
    });

    typeNewSave.addEventListener('click', async () => {
        const name = typeNewInput.value.trim();
        if (!name) return;
        typeNewSave.disabled = true;
        try {
            const term = await FA.post('wp/v2/fa_media_type', { name });
            typeNewSection.hidden = true;
            typeAddBtn.hidden     = false;
            typeNewInput.value    = '';
            // Re-fetch and re-render so the new term appears, then auto-select it
            const terms = await FA.get('wp/v2/fa_media_type', { per_page: 100, orderby: 'name', order: 'asc' });
            selectedTypeId   = term.id;
            selectedTypeName = term.name;
            renderPills(terms);
        } catch (err) {
            alert('Could not create type: ' + (err.message || 'Unknown error'));
        } finally {
            typeNewSave.disabled = false;
        }
    });

    typeNewInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); typeNewSave.click(); }
        if (e.key === 'Escape') typeNewCancel.click();
    });

    loadTypePills();

    // ── Multi-step form ───────────────────────────────────────────────────────

    new MultiStepForm({
        formEl:      document.getElementById('fa-media-form'),
        submitLabel: 'Save to archive',
        steps: [
            {
                label: 'Upload',
                validate() {
                    const title = document.getElementById('media_title').value.trim();
                    if (!title) return 'A title is required.';
                    if (photoUpload.isUploading()) return 'Please wait for the photo to finish uploading.';
                },
                collect() {
                    return {
                        media_title: document.getElementById('media_title').value.trim(),
                        photo:       photoUpload.getMediaId(),
                        file:        attachedFileId,
                        _photoUrl:   photoUpload.getPreviewUrl(),
                        _fileName:   attachedFileId ? document.getElementById('fa-file-attach-name').textContent : null,
                    };
                },
            },
            {
                label: 'Details',
                collect() {
                    return {
                        media_type_id:   selectedTypeId,
                        media_type_name: selectedTypeName,
                        date_circa:      document.getElementById('date_circa').value.trim(),
                        caption:         document.getElementById('caption').value.trim(),
                        people_in_media: peoplePicker.getValues(),
                        location:        locationPicker.getValues(),
                        event:           eventPicker.getValues(),
                        _peopleLabels:   peoplePicker.getSelected(),
                        _locationLabel:  locationPicker.getSelected(),
                        _eventLabel:     eventPicker.getSelected(),
                    };
                },
            },
            {
                label: 'Review',
            },
        ],
        onStepChange(stepIndex, data) {
            if (stepIndex === 2) renderReview(data);
        },
        async onComplete(data) {
            await submitMedia(data);
        },
    });

    // ── Review summary ────────────────────────────────────────────────────────

    function esc(s) {
        const el = document.createElement('span');
        el.textContent = String(s ?? '');
        return el.innerHTML;
    }

    function renderReview(data) {
        const rows = [
            { label: 'Title',     value: data.media_title },
            { label: 'Type',      value: data.media_type_name || null },
            { label: 'Date',      value: data.date_circa || null },
            { label: 'Caption',   value: data.caption || null },
            { label: 'People',    value: data._peopleLabels?.length   ? data._peopleLabels.map(p => p.title).join(', ') : null },
            { label: 'Location',  value: data._locationLabel?.[0]?.title || null },
            { label: 'Event',     value: data._eventLabel?.[0]?.title    || null },
            { label: 'File',      value: data._fileName || null },
            {
                label: 'Photo',
                value: data._photoUrl
                    ? `<img src="${esc(data._photoUrl)}" class="fa-review__photo" alt="Upload preview">`
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

    // ── Submission ────────────────────────────────────────────────────────────

    async function submitMedia(data) {
        const successEl = document.getElementById('fa-submit-success');

        const postFields = { title: data.media_title };
        if (data.media_type_id) {
            postFields.fa_media_type = [data.media_type_id];
        }

        const acfFields = {
            caption:        data.caption        || '',
            date_circa:     data.date_circa      || '',
            photo:          data.photo           || '',
            file:           data.file            || '',
            people_in_media: data.people_in_media || [],
            location:       data.location        || [],
            event:          data.event           || [],
        };

        const result = await FA.createPost('media', postFields, acfFields);

        document.getElementById('fa-form-nav').hidden = true;

        const title = result.title?.rendered || data.media_title;
        successEl.innerHTML = `
            <strong>${esc(title)}</strong> has been added to the archive.<br><br>
            <a href="${esc(result.link)}" class="fa-btn fa-btn--primary fa-btn--sm">View item</a>
            &nbsp;
            <a href="" id="fa-add-another" class="fa-btn fa-btn--secondary fa-btn--sm">Add another</a>
        `;
        successEl.hidden = false;

        document.getElementById('fa-add-another').addEventListener('click', e => {
            e.preventDefault();
            window.location.reload();
        });
    }

}());
