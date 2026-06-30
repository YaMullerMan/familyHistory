<?php
/* Template Name: Family Tree */

get_header();
?>

<div class="fa-page fa-tree-page">

    <div class="fa-tree-toolbar">
        <h1 class="fa-tree-toolbar__title">Family Tree</h1>
        <div class="fa-tree-toolbar__controls">
            <input type="search" id="fa-tree-search" class="fa-input fa-input--sm"
                placeholder="Jump to person…" autocomplete="off" style="width:200px;">
            <ul id="fa-tree-search-results" class="fa-picker__dropdown" hidden></ul>
        </div>
    </div>

    <div id="fa-tree-loading" class="fa-tree-loading" aria-live="polite">
        <span class="fa-tree-loading__dot"></span>
        <span class="fa-tree-loading__dot"></span>
        <span class="fa-tree-loading__dot"></span>
        <span style="margin-left:.5rem;color:var(--text-muted);font-size:.875rem;">Loading tree…</span>
    </div>

    <div id="fa-tree-error" class="fa-notice fa-notice--error" hidden></div>

    <div class="fa-tree-scroll">
        <div id="fa-tree-root" class="fa-tree-root" aria-label="Family tree"></div>
    </div>

</div>

<?php get_footer(); ?>
