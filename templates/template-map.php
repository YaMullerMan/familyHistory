<?php
/* Template Name: Map */

get_header();

// Type definitions for the filter bar (matches location_type ACF choices)
// active_default controls which types are visible on initial load
$map_types = [
    'residence'   => ['label' => 'Residence',   'color' => '#2563eb', 'active' => true],
    'birthplace'  => ['label' => 'Birthplace',  'color' => '#3B6D11', 'active' => false],
    'immigration' => ['label' => 'Immigration', 'color' => '#7c3aed', 'active' => false],
];
?>

<div class="fa-map-page">

    <div class="fa-map-toolbar">
        <h1 class="fa-map-toolbar__title">Map</h1>

        <div class="fa-map-filters" role="group" aria-label="Filter by location type">
            <?php foreach ($map_types as $key => $cfg): ?>
                <button class="fa-map-filter<?php echo $cfg['active'] ? ' fa-map-filter--active' : ''; ?>"
                        data-filter="<?php echo esc_attr($key); ?>"
                        style="--filter-color: <?php echo esc_attr($cfg['color']); ?>"
                        aria-pressed="<?php echo $cfg['active'] ? 'true' : 'false'; ?>">
                    <span class="fa-map-filter__dot" aria-hidden="true"></span>
                    <?php echo esc_html($cfg['label']); ?>
                </button>
            <?php endforeach; ?>
        </div>
    </div>

    <div class="fa-map-wrap">
        <div id="fa-map-canvas" class="fa-map-canvas" aria-label="Family locations map"></div>
        <div id="fa-map-loading" class="fa-map-loading" aria-live="polite">
            <span class="fa-tree-loading__dot"></span>
            <span class="fa-tree-loading__dot"></span>
            <span class="fa-tree-loading__dot"></span>
            <span>Loading locations…</span>
        </div>
        <div id="fa-map-empty" class="fa-map-empty" hidden>
            No mapped locations yet. Add addresses to locations to see them here.
        </div>
    </div>

</div>

<?php get_footer(); ?>
