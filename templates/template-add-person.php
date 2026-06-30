<?php
/* Template Name: Add a person */

if (!is_user_logged_in()) {
    wp_redirect(wp_login_url(get_permalink()));
    exit;
}

get_header();
?>

<div class="fa-page fa-add-person">

    <div class="fa-form-page-header">
        <h1>Add a person</h1>
        <p>Fill in what you know — only first and last name are required.</p>
    </div>

    <!-- Step indicator -->
    <div id="fa-stepper" class="fa-stepper" aria-label="Form progress">
        <div class="fa-stepper__step fa-stepper__step--active">
            <span class="fa-stepper__num">1</span>
            <span class="fa-stepper__label">Basic info</span>
        </div>
        <div class="fa-stepper__connector"></div>
        <div class="fa-stepper__step">
            <span class="fa-stepper__num">2</span>
            <span class="fa-stepper__label">Relationships</span>
        </div>
        <div class="fa-stepper__connector"></div>
        <div class="fa-stepper__step">
            <span class="fa-stepper__num">3</span>
            <span class="fa-stepper__label">Photo</span>
        </div>
        <div class="fa-stepper__connector"></div>
        <div class="fa-stepper__step">
            <span class="fa-stepper__num">4</span>
            <span class="fa-stepper__label">Bio</span>
        </div>
        <div class="fa-stepper__connector"></div>
        <div class="fa-stepper__step">
            <span class="fa-stepper__num">5</span>
            <span class="fa-stepper__label">Review</span>
        </div>
    </div>

    <form id="fa-person-form" novalidate>

        <!-- ================================================================
             Step 1 — Basic info
             ================================================================ -->
        <div class="fa-step-panel" data-step="0">
            <div class="fa-card">
                <h2 class="fa-form-section-title">Basic information</h2>

                <div class="fa-form-row fa-form-row--4">
                    <div class="fa-field">
                        <label class="fa-label" for="first_name">First name <span class="fa-required">*</span></label>
                        <input class="fa-input" type="text" id="first_name" name="first_name" autocomplete="given-name">
                    </div>
                    <div class="fa-field">
                        <label class="fa-label" for="middle_name">Middle name</label>
                        <input class="fa-input" type="text" id="middle_name" name="middle_name">
                    </div>
                    <div class="fa-field">
                        <label class="fa-label" for="last_name">Last name <span class="fa-required">*</span></label>
                        <input class="fa-input" type="text" id="last_name" name="last_name" autocomplete="family-name">
                    </div>
                    <div class="fa-field">
                        <label class="fa-label" for="maiden_name">Maiden name</label>
                        <input class="fa-input" type="text" id="maiden_name" name="maiden_name">
                    </div>
                </div>

                <div class="fa-form-row" style="margin-top:0.25rem;">
                    <div class="fa-field">
                        <label class="fa-label">Status</label>
                        <div class="fa-toggle-row">
                            <label class="fa-toggle">
                                <input type="checkbox" id="is_living" name="is_living" checked>
                                <span class="fa-toggle__slider"></span>
                            </label>
                            <span id="is_living_label" class="fa-toggle-label">Living</span>
                        </div>
                    </div>
                </div>

                <hr class="fa-form-divider">
                <h3 class="fa-form-sub-title">Birth</h3>

                <div class="fa-form-row fa-form-row--2">
                    <div class="fa-field">
                        <label class="fa-label" for="birth_date">Birth date</label>
                        <input class="fa-input" type="date" id="birth_date" name="birth_date">
                    </div>
                    <div class="fa-field">
                        <label class="fa-label">Birth location</label>
                        <div id="birth-location-picker"></div>
                    </div>
                </div>

                <div id="death-section">
                    <hr class="fa-form-divider">
                    <h3 class="fa-form-sub-title">Death</h3>
                    <div class="fa-form-row fa-form-row--2">
                        <div class="fa-field">
                            <label class="fa-label" for="death_date">Death date</label>
                            <input class="fa-input" type="date" id="death_date" name="death_date">
                        </div>
                        <div class="fa-field">
                            <label class="fa-label">Death location</label>
                            <div id="death-location-picker"></div>
                        </div>
                    </div>
                </div>

            </div>
        </div><!-- /step 1 -->


        <!-- ================================================================
             Step 2 — Relationships
             ================================================================ -->
        <div class="fa-step-panel" data-step="1" hidden>
            <div class="fa-card">
                <h2 class="fa-form-section-title">Relationships</h2>
                <p class="fa-form-hint">Search for people already in the archive. You can always update relationships later.</p>

                <div class="fa-form-field-group">
                    <div class="fa-field">
                        <label class="fa-label">Parents <span class="fa-field-note">(max 2)</span></label>
                        <div id="parents-picker"></div>
                    </div>
                    <div class="fa-field">
                        <label class="fa-label">Spouse(s)</label>
                        <div id="spouses-picker"></div>
                    </div>
                    <div class="fa-field">
                        <label class="fa-label">Children</label>
                        <div id="children-picker"></div>
                    </div>
                </div>
            </div>
        </div><!-- /step 2 -->


        <!-- ================================================================
             Step 3 — Profile photo
             ================================================================ -->
        <div class="fa-step-panel" data-step="2" hidden>
            <div class="fa-card">
                <h2 class="fa-form-section-title">Profile photo</h2>
                <p class="fa-form-hint">Helps identify this person across the archive. Optional.</p>
                <div id="photo-dropzone" class="fa-dropzone"></div>
                <div id="photo-upload-error" class="fa-notice fa-notice--error" style="margin-top:0.75rem;" hidden></div>
            </div>
        </div><!-- /step 3 -->


        <!-- ================================================================
             Step 4 — Bio & notes
             ================================================================ -->
        <div class="fa-step-panel" data-step="3" hidden>
            <div class="fa-card">
                <h2 class="fa-form-section-title">Bio & notes</h2>

                <div class="fa-field">
                    <label class="fa-label" for="bio">Biography</label>
                    <textarea class="fa-textarea" id="bio" name="bio" rows="7"
                        placeholder="A brief biography, personality, occupation, anecdotes — anything worth preserving…"></textarea>
                </div>

                <div class="fa-field" style="margin-top:1.25rem;">
                    <label class="fa-label" for="family_branch">Family branch</label>
                    <p class="fa-form-hint">The surname line this person belongs to, e.g. Henderson, Watson, Robinson.</p>
                    <input class="fa-input" type="text" id="family_branch" name="family_branch"
                        list="branch-datalist" placeholder="e.g. Henderson" autocomplete="off" style="max-width:320px;">
                    <datalist id="branch-datalist"></datalist>
                </div>
            </div>
        </div><!-- /step 4 -->


        <!-- ================================================================
             Step 5 — Review & save
             ================================================================ -->
        <div class="fa-step-panel" data-step="4" hidden>
            <div class="fa-card">
                <h2 class="fa-form-section-title">Review & save</h2>
                <p class="fa-form-hint">Check the details below. Go back to make changes, or save to add this person to the archive.</p>
                <div id="fa-review-summary"></div>
                <div id="fa-submit-success" class="fa-notice fa-notice--success" style="margin-top:1rem;" hidden></div>
            </div>
        </div><!-- /step 5 -->


        <!-- Navigation bar -->
        <div class="fa-form-nav" id="fa-form-nav">
            <button type="button" class="fa-btn fa-btn--secondary" id="fa-back-btn" hidden>Back</button>
            <div class="fa-form-nav__right">
                <span class="fa-step-counter" id="fa-step-counter"></span>
                <button type="button" class="fa-btn fa-btn--primary" id="fa-next-btn">Next</button>
            </div>
        </div>

    </form>
</div><!-- /.fa-add-person -->

<?php get_footer(); ?>
