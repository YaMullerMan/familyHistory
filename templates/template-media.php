<?php
/* Template Name: Media */

// Find the Add Media page
$add_media_pages = get_posts([
    'post_type'      => 'page',
    'posts_per_page' => 1,
    'meta_key'       => '_wp_page_template',
    'meta_value'     => 'templates/template-add-media.php',
    'fields'         => 'ids',
]);
$add_media_url = $add_media_pages ? get_permalink($add_media_pages[0]) : null;

// All media types for filter pills (alphabetical)
$media_types = get_terms([
    'taxonomy'   => 'fa_media_type',
    'hide_empty' => false,
    'orderby'    => 'name',
    'order'      => 'ASC',
]);

// Initial media query — all items, newest first
$media_query = new WP_Query([
    'post_type'      => 'fa_media',
    'posts_per_page' => 96,
    'orderby'        => 'date',
    'order'          => 'DESC',
]);

get_header();
?>

<div class="fa-page fa-media-page">

    <!-- ── Page header ────────────────────────────────────────────────── -->
    <div class="fa-media-header">
        <div class="fa-media-header__text">
            <h1>Media</h1>
            <p>Photos, documents, and other artifacts from the family archive.</p>
        </div>
        <?php if ($add_media_url && is_user_logged_in()): ?>
            <a href="<?php echo esc_url($add_media_url); ?>" class="fa-btn fa-btn--primary fa-btn--lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                Add media
            </a>
        <?php endif; ?>
    </div>

    <!-- ── Search ─────────────────────────────────────────────────────── -->
    <div class="fa-media-search">
        <div class="fa-media-search__wrap">
            <svg class="fa-media-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="search" id="fa-media-search" class="fa-input fa-media-search__input"
                   placeholder="Search media…" autocomplete="off">
        </div>
    </div>

    <!-- ── Type filters ───────────────────────────────────────────────── -->
    <?php if (!empty($media_types) && !is_wp_error($media_types)): ?>
    <div class="fa-media-filters" role="group" aria-label="Filter by media type">
        <button class="fa-media-filter fa-media-filter--active" data-type="all" aria-pressed="true">All</button>
        <?php foreach ($media_types as $type): ?>
            <button class="fa-media-filter" data-type="<?php echo esc_attr($type->slug); ?>" aria-pressed="false">
                <?php echo esc_html($type->name); ?>
            </button>
        <?php endforeach; ?>
    </div>
    <?php endif; ?>

    <!-- ── Media grid ─────────────────────────────────────────────────── -->
    <div id="fa-media-grid" class="fa-media-grid">
        <?php if ($media_query->have_posts()): ?>
            <?php while ($media_query->have_posts()): $media_query->the_post();
                $post_id   = get_the_ID();
                $photo     = get_field('photo', $post_id);
                $date_circa = get_field('date_circa', $post_id);
                $people    = get_field('people_in_media', $post_id) ?: [];
                $thumb     = $photo ? ($photo['sizes']['medium'] ?? $photo['url']) : null;
                $types     = get_the_terms($post_id, 'fa_media_type') ?: [];
                $type_slugs = implode(' ', wp_list_pluck($types, 'slug'));
                $type_label = $types ? $types[0]->name : '';
            ?>
                <a href="<?php the_permalink(); ?>"
                   class="fa-media-item"
                   data-type="<?php echo esc_attr($type_slugs ?: 'uncategorized'); ?>">
                    <div class="fa-media-item__thumb <?php echo $thumb ? '' : 'fa-media-item__thumb--placeholder'; ?>">
                        <?php if ($thumb): ?>
                            <img src="<?php echo esc_url($thumb); ?>"
                                 alt="<?php the_title_attribute(); ?>"
                                 loading="lazy">
                        <?php else: ?>
                            <?php echo fa_media_type_icon($type_label); ?>
                        <?php endif; ?>
                    </div>
                    <div class="fa-media-item__body">
                        <?php if ($type_label): ?>
                            <span class="fa-media-item__type"><?php echo esc_html($type_label); ?></span>
                        <?php endif; ?>
                        <div class="fa-media-item__title"><?php the_title(); ?></div>
                        <?php if ($date_circa): ?>
                            <div class="fa-media-item__date"><?php echo esc_html($date_circa); ?></div>
                        <?php endif; ?>
                        <?php if ($people): ?>
                            <div class="fa-media-item__people">
                                <?php
                                $shown = array_slice($people, 0, 2);
                                foreach ($shown as $p):
                                    $fn = get_field('first_name', $p->ID);
                                    $ln = get_field('last_name',  $p->ID);
                                    echo '<span>' . esc_html(trim("$fn $ln") ?: get_the_title($p->ID)) . '</span>';
                                endforeach;
                                if (count($people) > 2):
                                    echo '<span>+' . (count($people) - 2) . ' more</span>';
                                endif;
                                ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </a>
            <?php endwhile; wp_reset_postdata(); ?>
        <?php else: ?>
            <div class="fa-media-empty" id="fa-media-empty-initial">
                <p>No media yet.</p>
                <?php if ($add_media_url && is_user_logged_in()): ?>
                    <a href="<?php echo esc_url($add_media_url); ?>" class="fa-btn fa-btn--primary">Add the first item</a>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>

    <!-- Search empty state -->
    <div id="fa-media-empty" class="fa-media-empty" hidden>
        <p>No media matched "<span id="fa-media-empty-term"></span>".</p>
    </div>

</div>

<?php get_footer(); ?>

<?php
function fa_media_type_icon($type) {
    $type_lower = strtolower($type);
    if (str_contains($type_lower, 'audio')) {
        $path = '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>';
    } elseif (str_contains($type_lower, 'video')) {
        $path = '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>';
    } elseif (str_contains($type_lower, 'document') || str_contains($type_lower, 'certificate') || str_contains($type_lower, 'newspaper')) {
        $path = '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>';
    } else {
        $path = '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>';
    }
    return '<svg class="fa-media-item__icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">' . $path . '</svg>';
}
?>
