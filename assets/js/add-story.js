(function () {

    // ── Relationship pickers ──────────────────────────────────────────────────

    const authorPicker = new RelationshipPicker(
        document.getElementById('author-picker'),
        { postType: 'fa_person', max: 1, placeholder: 'Search family members…' }
    );

    const peoplePicker = new RelationshipPicker(
        document.getElementById('people-picker'),
        { postType: 'fa_person', placeholder: 'Search people…' }
    );

    const locationsPicker = new RelationshipPicker(
        document.getElementById('locations-picker'),
        { postType: 'fa_location', placeholder: 'Search locations…' }
    );

    // ── Cover image upload ────────────────────────────────────────────────────

    const coverUpload = new FileUpload(
        document.getElementById('cover-dropzone'),
        {
            onUpload: () => {},
            onError: (msg) => {
                const el = document.getElementById('cover-upload-error');
                el.textContent = msg;
                el.hidden = false;
            },
        }
    );

    // ── Live word count ───────────────────────────────────────────────────────

    const contentEl   = document.getElementById('story_content');
    const wordCountEl = document.getElementById('fa-word-count');

    function updateWordCount() {
        const text  = contentEl.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        wordCountEl.textContent = words === 0 ? '' : words + ' word' + (words === 1 ? '' : 's');
    }
    contentEl.addEventListener('input', updateWordCount);

    // ── Multi-step form ───────────────────────────────────────────────────────

    new MultiStepForm({
        formEl:      document.getElementById('fa-story-form'),
        submitLabel: 'Save story',
        steps: [
            {
                label: 'Write',
                validate() {
                    const title   = document.getElementById('story_title').value.trim();
                    const content = contentEl.value.trim();
                    if (!title)   return 'A title is required.';
                    if (!content) return 'The story cannot be empty.';
                },
                collect() {
                    return {
                        story_title:   document.getElementById('story_title').value.trim(),
                        story_date:    document.getElementById('story_date').value,
                        story_content: contentEl.value.trim(),
                    };
                },
            },
            {
                label: 'People',
                collect() {
                    return {
                        author_person:    authorPicker.getValues(),
                        people_featured:  peoplePicker.getValues(),
                        _authorLabels:    authorPicker.getSelected(),
                        _peopleLabels:    peoplePicker.getSelected(),
                    };
                },
            },
            {
                label: 'Places & photo',
                validate() {
                    if (coverUpload.isUploading()) {
                        return 'Please wait for the cover image to finish uploading.';
                    }
                },
                collect() {
                    return {
                        locations_featured: locationsPicker.getValues(),
                        cover_image:        coverUpload.getMediaId(),
                        _locationsLabels:   locationsPicker.getSelected(),
                        _coverUrl:          coverUpload.getPreviewUrl(),
                    };
                },
            },
            {
                label: 'Review',
            },
        ],
        onStepChange(stepIndex, data) {
            if (stepIndex === 3) renderReview(data);
        },
        async onComplete(data) {
            await submitStory(data);
        },
    });

    // ── Review summary ────────────────────────────────────────────────────────

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

    function excerpt(text, max = 200) {
        if (!text) return null;
        return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
    }

    function renderReview(data) {
        const rows = [
            { label: 'Title',     value: data.story_title },
            { label: 'Date',      value: fmtDate(data.story_date) },
            { label: 'Story',     value: excerpt(data.story_content) },
            { label: 'Author',    value: data._authorLabels?.[0]?.title || null },
            { label: 'People',    value: data._peopleLabels?.length    ? data._peopleLabels.map(p => p.title).join(', ')    : null },
            { label: 'Locations', value: data._locationsLabels?.length ? data._locationsLabels.map(l => l.title).join(', ') : null },
            {
                label: 'Cover',
                value: data._coverUrl
                    ? `<img src="${esc(data._coverUrl)}" class="fa-review__photo" alt="Cover image">`
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

    // Convert textarea plain text to HTML paragraphs (mirrors WordPress wpautop).
    function autoP(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        const escaped = div.innerHTML;
        return '<p>' + escaped.replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
    }

    async function submitStory(data) {
        const successEl = document.getElementById('fa-submit-success');

        const result = await FA.createPost(
            'story',
            { title: data.story_title },
            {
                story_content:      autoP(data.story_content),
                story_date:         data.story_date         || '',
                author_person:      data.author_person      || [],
                people_featured:    data.people_featured    || [],
                locations_featured: data.locations_featured || [],
                cover_image:        data.cover_image        || '',
            }
        );

        document.getElementById('fa-form-nav').hidden = true;

        const title = result.title?.rendered || data.story_title;
        successEl.innerHTML = `
            <strong>${esc(title)}</strong> has been saved to the archive.<br><br>
            <a href="${esc(result.link)}" class="fa-btn fa-btn--primary fa-btn--sm">Read story</a>
            &nbsp;
            <a href="" id="fa-add-another" class="fa-btn fa-btn--secondary fa-btn--sm">Write another</a>
        `;
        successEl.hidden = false;

        document.getElementById('fa-add-another').addEventListener('click', e => {
            e.preventDefault();
            window.location.reload();
        });
    }

}());
