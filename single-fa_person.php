<?php
$person_id   = get_the_ID();

// Basic fields
$first_name  = get_field('first_name',  $person_id) ?: get_the_title();
$middle_name = get_field('middle_name', $person_id);
$last_name   = get_field('last_name',   $person_id);
$maiden_name = get_field('maiden_name', $person_id);
$is_living   = get_field('is_living',   $person_id);
$bio         = get_field('bio',         $person_id);
$birth_date  = get_field('birth_date',  $person_id);
$death_date  = get_field('death_date',  $person_id);
$birth_loc   = get_field('birth_location', $person_id);
$death_loc   = get_field('death_location', $person_id);
$photo       = get_field('profile_photo',  $person_id);

// Current address
$current_address = get_field('current_address', $person_id);
$current_city    = get_field('current_city',    $person_id);
$current_state   = get_field('current_state',   $person_id);
$current_zip     = get_field('current_zip',     $person_id);

// Relationships
$parents         = get_field('parents',         $person_id) ?: [];
$spouses         = get_field('spouses',         $person_id) ?: [];
$former_spouses  = get_field('former_spouses',  $person_id) ?: [];
$children        = get_field('children',        $person_id) ?: [];

// Taxonomy
$branches = get_the_terms($person_id, 'fa_branch') ?: [];

// Derived display values
$name_parts   = array_filter([$first_name, $middle_name, $last_name]);
$display_name = implode(' ', $name_parts);
$birth_year   = $birth_date ? substr($birth_date, 0, 4) : null;
$death_year   = $death_date ? substr($death_date, 0, 4) : null;

// Initials for photo placeholder
$initials  = '';
$initials .= $first_name ? strtoupper($first_name[0]) : '';
$initials .= $last_name  ? strtoupper($last_name[0])  : '';

// Related content queries  (ACF relationship fields serialise IDs as "42" inside the meta)
$id_val = '"' . $person_id . '"';

$events = new WP_Query([
    'post_type'      => 'fa_event',
    'posts_per_page' => 20,
    'meta_query'     => [['key' => 'people_involved', 'value' => $id_val, 'compare' => 'LIKE']],
    'orderby'        => 'meta_value',
    'meta_key'       => 'event_date',
    'order'          => 'ASC',
]);

$stories = new WP_Query([
    'post_type'      => 'fa_story',
    'posts_per_page' => 10,
    'meta_query'     => [['key' => 'people_featured', 'value' => $id_val, 'compare' => 'LIKE']],
    'orderby'        => 'date',
    'order'          => 'DESC',
]);

$media_q = new WP_Query([
    'post_type'      => 'fa_media',
    'posts_per_page' => 12,
    'meta_query'     => [['key' => 'people_in_media', 'value' => $id_val, 'compare' => 'LIKE']],
]);

// Helpers
function fa_p_fmt_date($d) {
    if (!$d) return null;
    $dt = DateTime::createFromFormat('Y-m-d', $d);
    return $dt ? $dt->format('F j, Y') : $d;
}

function fa_p_person_card($p) {
    if (!($p instanceof WP_Post)) return '';
    $photo    = get_field('profile_photo', $p->ID);
    $img_url  = $photo ? ($photo['sizes']['thumbnail'] ?? $photo['url']) : null;
    $by       = get_field('birth_date', $p->ID);
    $dy       = get_field('death_date', $p->ID);
    $by       = $by ? substr($by, 0, 4) : null;
    $dy       = $dy ? substr($dy, 0, 4) : null;
    $years    = $by ? ($dy ? "{$by}–{$dy}" : "b. {$by}") : '';
    $fn       = get_field('first_name', $p->ID);
    $ln       = get_field('last_name',  $p->ID);
    $ini      = strtoupper(($fn ? $fn[0] : '') . ($ln ? $ln[0] : ''));

    ob_start(); ?>
    <a href="<?php echo esc_url(get_permalink($p->ID)); ?>" class="fa-person-card">
        <span class="fa-person-card__photo">
            <?php if ($img_url): ?>
                <img src="<?php echo esc_url($img_url); ?>" alt="<?php echo esc_attr(get_the_title($p->ID)); ?>">
            <?php else: ?>
                <span class="fa-person-card__initials"><?php echo esc_html($ini ?: '?'); ?></span>
            <?php endif; ?>
        </span>
        <span class="fa-person-card__info">
            <span class="fa-person-card__name"><?php echo esc_html(get_the_title($p->ID)); ?></span>
            <?php if ($years): ?>
                <span class="fa-person-card__years"><?php echo esc_html($years); ?></span>
            <?php endif; ?>
        </span>
    </a>
    <?php return ob_get_clean();
}

$event_type_labels = [
    'birth'       => 'Birth',
    'death'       => 'Death',
    'marriage'    => 'Marriage',
    'reunion'     => 'Family reunion',
    'immigration' => 'Immigration',
    'military'    => 'Military service',
    'graduation'  => 'Graduation',
    'other'       => 'Event',
];

get_header();
?>

<div class="fa-page fa-profile">

    <!-- ================================================================
         Hero — photo + name + dates + branch
         ================================================================ -->
    <div class="fa-card fa-profile-hero">

        <!-- Profile photo -->
        <div class="fa-profile-photo">
            <?php if ($photo && !empty($photo['url'])): ?>
                <img src="<?php echo esc_url($photo['sizes']['medium'] ?? $photo['url']); ?>"
                     alt="<?php echo esc_attr($display_name); ?>"
                     class="fa-profile-photo__img">
            <?php else: ?>
                <span class="fa-profile-photo__initials"><?php echo esc_html($initials ?: '?'); ?></span>
            <?php endif; ?>
        </div>

        <!-- Info -->
        <div class="fa-profile-info">
            <h1 class="fa-profile-name">
                <?php echo esc_html($display_name); ?>
                <?php if ($maiden_name): ?>
                    <span class="fa-profile-maiden">(née <?php echo esc_html($maiden_name); ?>)</span>
                <?php endif; ?>
            </h1>

            <div class="fa-profile-dates">
                <?php if ($birth_date): ?>
                    <span class="fa-profile-date-item">
                        <span class="fa-profile-date-label">Born</span>
                        <?php echo esc_html(fa_p_fmt_date($birth_date)); ?>
                        <?php
                        $bl = is_array($birth_loc) ? ($birth_loc[0] ?? null) : $birth_loc;
                        if ($bl instanceof WP_Post):
                            $city    = get_field('city',           $bl->ID);
                            $country = get_field('country',        $bl->ID);
                            $place   = implode(', ', array_filter([$city, $country])) ?: get_the_title($bl->ID);
                        ?>
                            <span class="fa-profile-date-location">in <a href="<?php echo esc_url(get_permalink($bl->ID)); ?>"><?php echo esc_html($place); ?></a></span>
                        <?php endif; ?>
                    </span>
                <?php endif; ?>

                <?php if (!$is_living && $death_date): ?>
                    <span class="fa-profile-date-sep" aria-hidden="true">·</span>
                    <span class="fa-profile-date-item">
                        <span class="fa-profile-date-label">Died</span>
                        <?php echo esc_html(fa_p_fmt_date($death_date)); ?>
                        <?php
                        $dl = is_array($death_loc) ? ($death_loc[0] ?? null) : $death_loc;
                        if ($dl instanceof WP_Post):
                            $city    = get_field('city',    $dl->ID);
                            $country = get_field('country', $dl->ID);
                            $place   = implode(', ', array_filter([$city, $country])) ?: get_the_title($dl->ID);
                        ?>
                            <span class="fa-profile-date-location">in <a href="<?php echo esc_url(get_permalink($dl->ID)); ?>"><?php echo esc_html($place); ?></a></span>
                        <?php endif; ?>
                    </span>
                <?php elseif ($is_living && $birth_year): ?>
                    <span class="fa-profile-date-sep" aria-hidden="true">·</span>
                    <span class="fa-profile-date-item fa-profile-age">
                        Age <?php echo (int)(date('Y') - (int)$birth_year); ?>
                    </span>
                <?php endif; ?>
            </div>

            <?php
            $addr_parts = array_filter([
                $current_address,
                implode(' ', array_filter([$current_city, $current_state])),
                $current_zip,
            ]);
            if ($addr_parts): ?>
                <div class="fa-profile-address">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <?php echo esc_html(implode(', ', $addr_parts)); ?>
                </div>
            <?php endif; ?>

            <?php if ($branches || !$is_living): ?>
                <div class="fa-profile-tags">
                    <?php foreach ($branches as $branch): ?>
                        <a href="<?php echo esc_url(get_term_link($branch)); ?>" class="fa-badge"><?php echo esc_html($branch->name); ?></a>
                    <?php endforeach; ?>
                    <?php if (!$is_living): ?>
                        <!-- <span class="fa-badge fa-badge--muted">Deceased</span> -->
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </div>

        <!-- Edit button -->
        <?php if (current_user_can('edit_post', $person_id)):
            $add_person_pages = get_posts([
                'post_type'      => 'page',
                'posts_per_page' => 1,
                'meta_key'       => '_wp_page_template',
                'meta_value'     => 'templates/template-add-person.php',
                'fields'         => 'ids',
            ]);
            $edit_url = $add_person_pages
                ? add_query_arg('edit', $person_id, get_permalink($add_person_pages[0]))
                : get_edit_post_link($person_id);
        ?>
            <div class="fa-profile-actions">
                <a href="<?php echo esc_url($edit_url); ?>" class="fa-btn fa-btn--secondary fa-btn--sm">Edit</a>
            </div>
        <?php endif; ?>

        <?php if ($bio): ?>
            <div class="fa-profile-hero__bio fa-profile-bio">
                <?php echo wp_kses_post($bio); ?>
            </div>
        <?php endif; ?>

    </div><!-- /.fa-profile-hero -->


    <!-- ================================================================
         Body — main content + sidebar
         ================================================================ -->
    <div class="fa-profile-body">

        <!-- Main column -->
        <div class="fa-profile-main">

            <!-- Events timeline -->
            <?php if ($events->have_posts()): ?>
                <section class="fa-profile-section" aria-labelledby="fa-events-heading">
                    <h2 class="fa-profile-section__title" id="fa-events-heading">Events</h2>
                    <ol class="fa-timeline">
                        <?php while ($events->have_posts()): $events->the_post();
                            $evt_date  = get_field('event_date');
                            $evt_type  = get_field('event_type');
                            $evt_label = $event_type_labels[$evt_type] ?? 'Event';
                            $evt_loc   = get_field('location');
                            $evt_loc   = is_array($evt_loc) ? ($evt_loc[0] ?? null) : $evt_loc;
                        ?>
                            <li class="fa-timeline__item">
                                <span class="fa-timeline__dot" aria-hidden="true"></span>
                                <div class="fa-timeline__content">
                                    <div class="fa-timeline__header">
                                        <span class="fa-badge"><?php echo esc_html($evt_label); ?></span>
                                        <?php if ($evt_date): ?>
                                            <time class="fa-timeline__date" datetime="<?php echo esc_attr($evt_date); ?>">
                                                <?php echo esc_html(fa_p_fmt_date($evt_date)); ?>
                                            </time>
                                        <?php endif; ?>
                                    </div>
                                    <a class="fa-timeline__title" href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                                    <?php if ($evt_loc instanceof WP_Post): ?>
                                        <div class="fa-timeline__location">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                            </svg>
                                            <a href="<?php echo esc_url(get_permalink($evt_loc->ID)); ?>"><?php echo esc_html(get_the_title($evt_loc->ID)); ?></a>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            </li>
                        <?php endwhile; wp_reset_postdata(); ?>
                    </ol>
                </section>
            <?php endif; ?>

            <!-- Stories -->
            <?php if ($stories->have_posts()): ?>
                <section class="fa-profile-section" aria-labelledby="fa-stories-heading">
                    <h2 class="fa-profile-section__title" id="fa-stories-heading">Stories</h2>
                    <div class="fa-story-list">
                        <?php while ($stories->have_posts()): $stories->the_post();
                            $cover      = get_field('story_content');
                            $story_date = get_field('story_date');
                        ?>
                            <a href="<?php the_permalink(); ?>" class="fa-story-card">
                                <div class="fa-story-card__body">
                                    <h3 class="fa-story-card__title"><?php the_title(); ?></h3>
                                    <?php if ($story_date): ?>
                                        <span class="fa-story-card__date"><?php echo esc_html(fa_p_fmt_date($story_date)); ?></span>
                                    <?php endif; ?>
                                </div>
                                <svg class="fa-story-card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                    <path d="M5 12h14M12 5l7 7-7 7"/>
                                </svg>
                            </a>
                        <?php endwhile; wp_reset_postdata(); ?>
                    </div>
                </section>
            <?php endif; ?>

            <!-- Media -->
            <?php if ($media_q->have_posts()): ?>
                <section class="fa-profile-section" aria-labelledby="fa-media-heading">
                    <h2 class="fa-profile-section__title" id="fa-media-heading">Photos &amp; documents</h2>
                    <div class="fa-media-grid">
                        <?php while ($media_q->have_posts()): $media_q->the_post();
                            $m_type    = get_field('media_type');
                            $m_photo   = get_field('photo');
                            $m_caption = get_field('caption');
                            $m_circa   = get_field('date_circa');
                            $thumb_url = $m_photo ? ($m_photo['sizes']['medium'] ?? $m_photo['url']) : get_the_post_thumbnail_url(get_the_ID(), 'medium');
                        ?>
                            <a href="<?php the_permalink(); ?>" class="fa-media-thumb" title="<?php echo esc_attr($m_caption ?: get_the_title()); ?>">
                                <?php if ($thumb_url): ?>
                                    <img src="<?php echo esc_url($thumb_url); ?>" alt="<?php echo esc_attr($m_caption ?: get_the_title()); ?>">
                                <?php else: ?>
                                    <span class="fa-media-thumb__icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                                        </svg>
                                    </span>
                                <?php endif; ?>
                                <?php if ($m_circa): ?>
                                    <span class="fa-media-thumb__circa"><?php echo esc_html($m_circa); ?></span>
                                <?php endif; ?>
                            </a>
                        <?php endwhile; wp_reset_postdata(); ?>
                    </div>
                </section>
            <?php endif; ?>

            <?php if (!$bio && !$events->have_posts() && !$stories->have_posts() && !$media_q->have_posts()): ?>
                <p class="fa-empty-state" style="padding:1rem 0;">No additional information recorded yet.</p>
            <?php endif; ?>

        </div><!-- /.fa-profile-main -->


        <!-- Sidebar — relationships -->
        <?php $has_rels = $parents || $spouses || $former_spouses || $children; ?>
        <?php if ($has_rels): ?>
            <aside class="fa-profile-sidebar" aria-labelledby="fa-rels-heading">
                <div class="fa-card">
                    <h2 class="fa-profile-section__title" id="fa-rels-heading">Relationships</h2>

                    <?php if ($parents): ?>
                        <div class="fa-rels-group">
                            <h3 class="fa-rels-label"><?php echo count($parents) === 1 ? 'Parent' : 'Parents'; ?></h3>
                            <?php foreach ($parents as $p): echo fa_p_person_card($p); endforeach; ?>
                        </div>
                    <?php endif; ?>

                    <?php if ($spouses): ?>
                        <div class="fa-rels-group">
                            <h3 class="fa-rels-label"><?php echo count($spouses) === 1 ? 'Spouse' : 'Spouses'; ?></h3>
                            <?php foreach ($spouses as $p): echo fa_p_person_card($p); endforeach; ?>
                        </div>
                    <?php endif; ?>

                    <?php if ($former_spouses): ?>
                        <div class="fa-rels-group">
                            <h3 class="fa-rels-label"><?php echo count($former_spouses) === 1 ? 'Former spouse' : 'Former spouses'; ?></h3>
                            <?php foreach ($former_spouses as $p): echo fa_p_person_card($p); endforeach; ?>
                        </div>
                    <?php endif; ?>

                    <?php if ($children): ?>
                        <div class="fa-rels-group">
                            <h3 class="fa-rels-label"><?php echo count($children) === 1 ? 'Child' : 'Children'; ?></h3>
                            <?php foreach ($children as $p): echo fa_p_person_card($p); endforeach; ?>
                        </div>
                    <?php endif; ?>

                </div>
            </aside>
        <?php endif; ?>

    </div><!-- /.fa-profile-body -->

</div><!-- /.fa-profile -->

<?php get_footer(); ?>
