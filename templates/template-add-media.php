<?php
/* Template Name: Add media */

if (!is_user_logged_in()) {
    wp_redirect(wp_login_url(get_permalink()));
    exit;
}

get_header();
?>

<div class="fa-page fa-add-media">

    <div class="fa-form-page-header">
        <h1>Add media</h1>
        <p>Upload a photo, document, or other item to the family archive.</p>
    </div>

    <!-- Stepper -->
    <div id="fa-stepper" class="fa-stepper" aria-label="Form progress">
        <div class="fa-stepper__step fa-stepper__step--active">
            <span class="fa-stepper__num">1</span>
            <span class="fa-stepper__label">Upload</span>
        </div>
        <div class="fa-stepper__connector"></div>
        <div class="fa-stepper__step">
            <span class="fa-stepper__num">2</span>
            <span class="fa-stepper__label">Details</span>
        </div>
        <div class="fa-stepper__connector"></div>
        <div class="fa-stepper__step">
            <span class="fa-stepper__num">3</span>
            <span class="fa-stepper__label">Review</span>
        </div>
    </div>

    <form id="fa-media-form" novalidate>

        <!-- ================================================================
             Step 1 — Upload
             ================================================================ -->
        <div class="fa-step-panel" data-step="0">
            <div class="fa-card">
                <h2 class="fa-form-section-title">The item</h2>

                <div class="fa-field">
                    <label class="fa-label" for="media_title">Title <span class="fa-required">*</span></label>
                    <input class="fa-input" type="text" id="media_title" name="media_title"
                           placeholder="e.g. Wedding photo — June 1952">
                </div>

                <hr class="fa-form-divider">

                <div class="fa-field">
                    <label class="fa-label">Photo</label>
                    <p class="fa-form-hint">Accepted types: JPG, PNG, or WEBP.</p>
                    <div id="photo-dropzone" class="fa-dropzone"></div>
                    <div id="photo-upload-error" class="fa-notice fa-notice--error" style="margin-top:0.75rem;" hidden></div>
                </div>

                <hr class="fa-form-divider">

                <div class="fa-field">
                    <label class="fa-label">File attachment</label>
                    <p class="fa-form-hint">Attach a PDF, audio, video, or other document.</p>
                    <div class="fa-file-attach" id="fa-file-attach">
                        <label class="fa-file-attach__label">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                            </svg>
                            Choose file
                            <input type="file" id="media_file_input" class="fa-file-attach__input"
                                   accept=".pdf,.doc,.docx,.mp3,.mp4,.mov,.wav,.aiff,.m4a,.ogg">
                        </label>
                        <div id="fa-file-attach-preview" class="fa-file-attach__preview" hidden>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                            </svg>
                            <span id="fa-file-attach-name"></span>
                            <button type="button" id="fa-file-attach-remove" class="fa-file-attach__remove" aria-label="Remove file">&times;</button>
                        </div>
                        <div id="fa-file-attach-uploading" class="fa-file-attach__uploading" hidden>Uploading…</div>
                        <div id="fa-file-attach-error" class="fa-notice fa-notice--error" style="margin-top:0.5rem;" hidden></div>
                    </div>
                </div>

            </div>
        </div><!-- /step 1 -->


        <!-- ================================================================
             Step 2 — Details
             ================================================================ -->
        <div class="fa-step-panel" data-step="1" hidden>
            <div class="fa-card">
                <h2 class="fa-form-section-title">Details</h2>

                <div class="fa-form-field-group">

                    <div class="fa-field">
                        <label class="fa-label">Media type</label>
                        <p class="fa-form-hint">What kind of item is this?</p>
                        <div id="fa-type-picker" class="fa-type-picker">
                            <div class="fa-type-picker__pills" id="fa-type-pills">
                                <!-- Populated by JS -->
                            </div>
                            <div class="fa-type-picker__new" id="fa-type-new" hidden>
                                <input type="text" class="fa-input fa-input--sm" id="fa-type-new-input"
                                       placeholder="New type name…" style="max-width:200px;">
                                <button type="button" class="fa-btn fa-btn--sm fa-btn--primary" id="fa-type-new-save">Add</button>
                                <button type="button" class="fa-btn fa-btn--sm fa-btn--secondary" id="fa-type-new-cancel">Cancel</button>
                            </div>
                            <button type="button" class="fa-type-picker__add-btn" id="fa-type-add-btn">+ Add new type</button>
                        </div>
                    </div>

                    <div class="fa-field">
                        <label class="fa-label" for="date_circa">Date</label>
                        <p class="fa-form-hint">Exact or approximate — any format works ("circa 1945", "Summer 1967", "1952-06-14").</p>
                        <input class="fa-input" type="text" id="date_circa" name="date_circa"
                               placeholder="e.g. circa 1945" style="max-width:260px;">
                    </div>

                    <div class="fa-field">
                        <label class="fa-label" for="caption">Caption</label>
                        <textarea class="fa-textarea" id="caption" name="caption" rows="3"
                                  placeholder="A short description of the item…"></textarea>
                    </div>

                    <hr class="fa-form-divider" style="margin:0;">

                    <div class="fa-field">
                        <label class="fa-label">People in this item</label>
                        <div id="people-picker"></div>
                    </div>

                    <div class="fa-field">
                        <label class="fa-label">Location</label>
                        <div id="location-picker"></div>
                    </div>

                    <div class="fa-field">
                        <label class="fa-label">Related event</label>
                        <div id="event-picker"></div>
                    </div>

                </div>
            </div>
        </div><!-- /step 2 -->


        <!-- ================================================================
             Step 3 — Review & save
             ================================================================ -->
        <div class="fa-step-panel" data-step="2" hidden>
            <div class="fa-card">
                <h2 class="fa-form-section-title">Review &amp; save</h2>
                <p class="fa-form-hint">Check the details below, then save to add this item to the archive.</p>
                <div id="fa-review-summary"></div>
                <div id="fa-submit-success" class="fa-notice fa-notice--success" style="margin-top:1rem;" hidden></div>
            </div>
        </div><!-- /step 3 -->


        <!-- Navigation bar -->
        <div class="fa-form-nav" id="fa-form-nav">
            <button type="button" class="fa-btn fa-btn--secondary" id="fa-back-btn" hidden>Back</button>
            <div class="fa-form-nav__right">
                <span class="fa-step-counter" id="fa-step-counter"></span>
                <button type="button" class="fa-btn fa-btn--primary" id="fa-next-btn">Next</button>
            </div>
        </div>

    </form>
</div>

<?php get_footer(); ?>
