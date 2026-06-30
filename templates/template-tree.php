<?php
/* Template Name: Family Tree */

get_header();
?>

<div class="fa-page fa-tree-page">

    <div class="fa-tree-toolbar">
        <h1 class="fa-tree-toolbar__title">Family Tree</h1>
        <div class="fa-tree-toolbar__right">
            <div class="fa-tree-toolbar__zoom">
                <button id="fa-tree-zoom-out" class="fa-tree-zoom-btn" title="Zoom out" aria-label="Zoom out">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg>
                </button>
                <span id="fa-tree-zoom-label" class="fa-tree-zoom-label">100%</span>
                <button id="fa-tree-zoom-in" class="fa-tree-zoom-btn" title="Zoom in" aria-label="Zoom in">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                </button>
            </div>
            <div class="fa-tree-toolbar__controls">
                <input type="search" id="fa-tree-search" class="fa-input fa-input--sm"
                    placeholder="Jump to person…" autocomplete="off" style="width:200px;">
                <ul id="fa-tree-search-results" class="fa-picker__dropdown" hidden></ul>
            </div>
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
