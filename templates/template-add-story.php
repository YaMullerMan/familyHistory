<?php
/* Template Name: Add a story */

if (!is_user_logged_in()) {
    wp_redirect(wp_login_url(get_permalink()));
    exit;
}

get_header();
?>

<div class="fa-page fa-add-story">

    <div class="fa-form-page-header">
        <h1>Write a story</h1>
        <p>Preserve a memory, anecdote, or piece of family history in your own words.</p>
    </div>

    <!-- Step indicator -->
    <div id="fa-stepper" class="fa-stepper" aria-label="Form progress">
        <div class="fa-stepper__step fa-stepper__step--active">
            <span class="fa-stepper__num">1</span>
            <span class="fa-stepper__label">Write</span>
        </div>
        <div class="fa-stepper__connector"></div>
        <div class="fa-stepper__step">
            <span class="fa-stepper__num">2</span>
            <span class="fa-stepper__label">People</span>
        </div>
        <div class="fa-stepper__connector"></div>
        <div class="fa-stepper__step">
            <span class="fa-stepper__num">3</span>
            <span class="fa-stepper__label">Places & photo</span>
        </div>
        <div class="fa-stepper__connector"></div>
        <div class="fa-stepper__step">
            <span class="fa-stepper__num">4</span>
            <span class="fa-stepper__label">Review</span>
        </div>
    </div>

    <form id="fa-story-form" novalidate>

        <!-- ================================================================
             Step 1 — Write
             ================================================================ -->
        <div class="fa-step-panel" data-step="0">
            <div class="fa-card">
                <h2 class="fa-form-section-title">The story</h2>

                <div class="fa-field">
                    <label class="fa-label" for="story_title">Title <span class="fa-required">*</span></label>
                    <input class="fa-input" type="text" id="story_title" name="story_title"
                        placeholder="e.g. The summer we moved to Brisbane">
                </div>

                <div class="fa-field" style="margin-top:1.25rem; max-width:240px;">
                    <label class="fa-label" for="story_date">Approximate date</label>
                    <p class="fa-form-hint">When did this happen? A rough date is fine.</p>
                    <input class="fa-input" type="date" id="story_date" name="story_date">
                </div>

                <div class="fa-field" style="margin-top:1.25rem;">
                    <label class="fa-label" for="story_content">Story <span class="fa-required">*</span></label>
                    <p class="fa-form-hint">Write as much or as little as you like. Paragraphs are preserved.</p>
                    <textarea class="fa-textarea fa-textarea--story" id="story_content" name="story_content"
                        rows="14"
                        placeholder="It was the summer of 1974 when…"></textarea>
                    <div class="fa-word-count" id="fa-word-count" aria-live="polite"></div>
                </div>
            </div>
        </div><!-- /step 1 -->


        <!-- ================================================================
             Step 2 — People
             ================================================================ -->
        <div class="fa-step-panel" data-step="1" hidden>
            <div class="fa-card">
                <h2 class="fa-form-section-title">People</h2>
                <p class="fa-form-hint">Link the people this story is about. They'll see it on their profile pages.</p>

                <div class="fa-form-field-group">
                    <div class="fa-field">
                        <label class="fa-label">Written by <span class="fa-field-note">(family member, max 1)</span></label>
                        <div id="author-picker"></div>
                    </div>
                    <div class="fa-field">
                        <label class="fa-label">People featured</label>
                        <div id="people-picker"></div>
                    </div>
                </div>
            </div>
        </div><!-- /step 2 -->


        <!-- ================================================================
             Step 3 — Places & cover photo
             ================================================================ -->
        <div class="fa-step-panel" data-step="2" hidden>
            <div class="fa-card">
                <h2 class="fa-form-section-title">Places &amp; cover photo</h2>

                <div class="fa-field">
                    <label class="fa-label">Locations featured</label>
                    <p class="fa-form-hint">Where did this story take place?</p>
                    <div id="locations-picker"></div>
                </div>

                <hr class="fa-form-divider">

                <div class="fa-field">
                    <label class="fa-label">Cover image</label>
                    <p class="fa-form-hint">An optional photo to represent this story. Optional.</p>
                    <div id="cover-dropzone" class="fa-dropzone"></div>
                    <div id="cover-upload-error" class="fa-notice fa-notice--error" style="margin-top:0.75rem;" hidden></div>
                </div>
            </div>
        </div><!-- /step 3 -->


        <!-- ================================================================
             Step 4 — Review & save
             ================================================================ -->
        <div class="fa-step-panel" data-step="3" hidden>
            <div class="fa-card">
                <h2 class="fa-form-section-title">Review &amp; save</h2>
                <p class="fa-form-hint">Check the details below, then save to add this story to the archive.</p>
                <div id="fa-review-summary"></div>
                <div id="fa-submit-success" class="fa-notice fa-notice--success" style="margin-top:1rem;" hidden></div>
            </div>
        </div><!-- /step 4 -->


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
