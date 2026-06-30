/**
 * FileUpload — drag-and-drop file upload component.
 *
 * Uploads immediately on file selection via FA.uploadMedia().
 * Validates on next() via isUploading() before the form advances.
 *
 * Usage:
 *   const uploader = new FileUpload(dropzoneEl, {
 *     accept: 'image/*',
 *     maxMb: 10,
 *     onUpload: (mediaObj) => { ... },
 *     onError:  (msg)      => { ... },
 *   });
 *   uploader.getMediaId();    // WP attachment ID or null
 *   uploader.getPreviewUrl(); // object URL or source_url
 *   uploader.isUploading();   // true while upload is in flight
 */
class FileUpload {

    constructor(dropzone, options = {}) {
        this.dropzone   = dropzone;
        this.accept     = options.accept  || 'image/*';
        this.maxMb      = options.maxMb   || 10;
        this.onUpload   = options.onUpload || (() => {});
        this.onError    = options.onError  || (() => {});

        this._mediaId    = null;
        this._previewUrl = null;
        this._uploading  = false;

        this._render();
        this._bindEvents();
    }

    // ------------------------------------------------------------------
    // DOM
    // ------------------------------------------------------------------
    _render() {
        this.dropzone.innerHTML = `
            <div class="fa-dropzone__inner">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                     stroke-linejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p class="fa-dropzone__label">
                    Drop a photo here, or
                    <label class="fa-dropzone__browse">
                        browse
                        <input type="file"
                               class="fa-dropzone__file-input"
                               accept="${this.accept}"
                               style="position:absolute;opacity:0;pointer-events:none;width:0;height:0;">
                    </label>
                </p>
                <p class="fa-dropzone__hint">JPG, PNG or WEBP &mdash; max ${this.maxMb}MB</p>
            </div>
            <div class="fa-dropzone__preview" hidden>
                <img class="fa-dropzone__preview-img" alt="Profile photo preview">
                <button type="button" class="fa-dropzone__remove" aria-label="Remove photo">&times;</button>
            </div>
            <div class="fa-dropzone__uploading" hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round"
                     class="fa-spin" aria-hidden="true">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Uploading…
            </div>`;

        this._innerEl    = this.dropzone.querySelector('.fa-dropzone__inner');
        this._fileInput  = this.dropzone.querySelector('.fa-dropzone__file-input');
        this._previewEl  = this.dropzone.querySelector('.fa-dropzone__preview');
        this._previewImg = this.dropzone.querySelector('.fa-dropzone__preview-img');
        this._uploadingEl = this.dropzone.querySelector('.fa-dropzone__uploading');
        this._removeBtn  = this.dropzone.querySelector('.fa-dropzone__remove');
    }

    _bindEvents() {
        this._fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) this._handleFile(e.target.files[0]);
        });

        this.dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropzone.classList.add('fa-dropzone--over');
        });
        this.dropzone.addEventListener('dragleave', (e) => {
            if (!this.dropzone.contains(e.relatedTarget)) {
                this.dropzone.classList.remove('fa-dropzone--over');
            }
        });
        this.dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropzone.classList.remove('fa-dropzone--over');
            const file = e.dataTransfer?.files[0];
            if (file) this._handleFile(file);
        });

        this._removeBtn.addEventListener('click', () => this._clear());
    }

    // ------------------------------------------------------------------
    // File handling
    // ------------------------------------------------------------------
    async _handleFile(file) {
        if (!file.type.startsWith('image/')) {
            this.onError('Please choose an image file (JPG, PNG, WEBP).');
            return;
        }
        if (file.size > this.maxMb * 1024 * 1024) {
            this.onError(`File is too large. Maximum size is ${this.maxMb}MB.`);
            return;
        }

        // Show local preview immediately so the user sees something
        const reader = new FileReader();
        reader.onload = (e) => {
            this._previewUrl = e.target.result;
            this._previewImg.src = e.target.result;
            this._innerEl.hidden = true;
            this._previewEl.hidden = false;
        };
        reader.readAsDataURL(file);

        // Upload to WP media library
        this._uploading = true;
        this._uploadingEl.hidden = false;

        try {
            const media = await FA.uploadMedia(file);
            this._mediaId    = media.id;
            this._previewUrl = media.source_url || this._previewUrl;
            this.onUpload(media);
        } catch (err) {
            this.onError(err.message || 'Upload failed. Please try again.');
            this._clear();
        } finally {
            this._uploading = false;
            this._uploadingEl.hidden = true;
        }
    }

    _clear() {
        this._mediaId    = null;
        this._previewUrl = null;
        this._uploading  = false;
        this._previewEl.hidden    = true;
        this._uploadingEl.hidden  = true;
        this._innerEl.hidden      = false;
        this._fileInput.value     = '';
        this._previewImg.src      = '';
    }

    // ------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------
    getMediaId()    { return this._mediaId; }
    getPreviewUrl() { return this._previewUrl; }
    isUploading()   { return this._uploading; }

    reset() { this._clear(); }
}
