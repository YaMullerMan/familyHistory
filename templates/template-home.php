<?php
/* Template Name: Home */

$stats    = function_exists('fa_get_archive_stats')      ? fa_get_archive_stats()        : [];
$today    = function_exists('fa_get_today_in_history')   ? fa_get_today_in_history()     : ['birthdays' => [], 'anniversaries' => []];
$upcoming = function_exists('fa_get_upcoming_birthdays') ? fa_get_upcoming_birthdays(30) : [];

$recent = new WP_Query([
    'post_type'      => ['fa_person', 'fa_location', 'fa_event', 'fa_story', 'fa_media'],
    'posts_per_page' => 8,
    'orderby'        => 'date',
    'order'          => 'desc',
]);

$type_labels = [
    'fa_person'   => 'Person',
    'fa_location' => 'Location',
    'fa_event'    => 'Event',
    'fa_story'    => 'Story',
    'fa_media'    => 'Media',
];

get_header();
?>

<div class="fa-page fa-home">

    <!-- =====================================================================
         Row 1 — Today in history  +  At a glance
         ===================================================================== -->
    <div class="fa-home-top">

        <!-- Today in family history -->
        <section class="fa-card fa-today" aria-labelledby="fa-today-heading">
            <div class="fa-section-header">
                <h2 id="fa-today-heading">Today in family history</h2>
                <span class="fa-today-date"><?php echo date('F j'); ?></span>
            </div>

            <?php
            $has_today = !empty($today['birthdays']) || !empty($today['anniversaries']);
            if (!$has_today) : ?>
                <p class="fa-empty-state">Nothing on record for today.</p>
            <?php endif; ?>

            <?php if (!empty($today['birthdays'])) : ?>
                <h3 class="fa-today-sub">Birthdays</h3>
                <ul class="fa-today-list">
                    <?php foreach ($today['birthdays'] as $person) :
                        $birth = get_field('birth_date', $person->ID);
                        $year  = $birth ? substr($birth, 0, 4) : '';
                        $is_living = get_field('is_living', $person->ID);
                        $label = $is_living ? 'Birthday' : 'Born on this day';
                    ?>
                    <li class="fa-today-item">
                        <span class="fa-today-icon fa-today-icon--birthday">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 6c1.11 0 2-.89 2-2 0-.55-.22-1.05-.59-1.41L12 1l-1.41 1.59C10.22 2.95 10 3.45 10 4c0 1.11.89 2 2 2zm4 3H8v-.5C8 7.12 6.88 6 5.5 6S3 7.12 3 8.5V10H1v8h22v-8h-2v-1.5C21 7.12 19.88 6 18.5 6S16 7.12 16 8.5V9zM5 8.5c0-.28.22-.5.5-.5s.5.22.5.5V10H5V8.5zm13 0c0-.28.22-.5.5-.5s.5.22.5.5V10h-1V8.5z"/>
                            </svg>
                        </span>
                        <span class="fa-today-text">
                            <a href="<?php echo esc_url(get_permalink($person->ID)); ?>"><?php echo esc_html(get_the_title($person->ID)); ?></a>
                            <?php if ($year) : ?>
                                <span class="fa-today-year"><?php echo $label; ?> in <?php echo esc_html($year); ?></span>
                            <?php else : ?>
                                <span class="fa-today-year"><?php echo $label; ?></span>
                            <?php endif; ?>
                        </span>
                    </li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>

            <?php if (!empty($today['anniversaries'])) : ?>
                <h3 class="fa-today-sub">Events</h3>
                <ul class="fa-today-list">
                    <?php foreach ($today['anniversaries'] as $event) :
                        $evt_date = get_field('event_date', $event->ID);
                        $year     = $evt_date ? substr($evt_date, 0, 4) : '';
                        $type     = get_field('event_type', $event->ID);
                        $type_str = $type ? ucfirst(str_replace('_', ' ', $type)) : 'Event';
                    ?>
                    <li class="fa-today-item">
                        <span class="fa-today-icon fa-today-icon--event">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
                            </svg>
                        </span>
                        <span class="fa-today-text">
                            <a href="<?php echo esc_url(get_permalink($event->ID)); ?>"><?php echo esc_html(get_the_title($event->ID)); ?></a>
                            <?php if ($year) : ?>
                                <span class="fa-today-year"><?php echo esc_html($type_str); ?> in <?php echo esc_html($year); ?></span>
                            <?php else : ?>
                                <span class="fa-today-year"><?php echo esc_html($type_str); ?></span>
                            <?php endif; ?>
                        </span>
                    </li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        </section>

        <!-- At a glance -->
        <section class="fa-card fa-glance" aria-labelledby="fa-glance-heading">
            <div class="fa-section-header">
                <h2 id="fa-glance-heading">At a glance</h2>
            </div>
            <div class="fa-stats-grid">
                <a href="<?php echo esc_url(home_url('/people')); ?>" class="fa-stat-card fa-stat-card--link">
                    <span class="fa-stat-card__num"><?php echo intval($stats['people'] ?? 0); ?></span>
                    <span class="fa-stat-card__label">People</span>
                </a>
                <a href="<?php echo esc_url(home_url('/places')); ?>" class="fa-stat-card fa-stat-card--link">
                    <span class="fa-stat-card__num"><?php echo intval($stats['locations'] ?? 0); ?></span>
                    <span class="fa-stat-card__label">Places</span>
                </a>
                <a href="<?php echo esc_url(home_url('/events')); ?>" class="fa-stat-card fa-stat-card--link">
                    <span class="fa-stat-card__num"><?php echo intval($stats['events'] ?? 0); ?></span>
                    <span class="fa-stat-card__label">Events</span>
                </a>
                <a href="<?php echo esc_url(home_url('/stories')); ?>" class="fa-stat-card fa-stat-card--link">
                    <span class="fa-stat-card__num"><?php echo intval($stats['stories'] ?? 0); ?></span>
                    <span class="fa-stat-card__label">Stories</span>
                </a>
                <a href="<?php echo esc_url(home_url('/media')); ?>" class="fa-stat-card fa-stat-card--link">
                    <span class="fa-stat-card__num"><?php echo intval($stats['media'] ?? 0); ?></span>
                    <span class="fa-stat-card__label">Media</span>
                </a>
            </div>
        </section>

    </div><!-- /.fa-home-top -->


    <!-- =====================================================================
         Row 2 — Quick action tiles
         ===================================================================== -->
    <section class="fa-tiles-section" aria-labelledby="fa-actions-heading">
        <div class="fa-section-header">
            <h2 id="fa-actions-heading">Quick actions</h2>
        </div>
        <div class="fa-grid-5">

            <a href="<?php echo esc_url(home_url('/add-person')); ?>" class="fa-tile">
                <span class="fa-tile__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                </span>
                <span class="fa-tile__name">Add a person</span>
                <span class="fa-tile__desc">Record a family member's details, dates, and relationships.</span>
            </a>

            <a href="<?php echo esc_url(home_url('/family-tree')); ?>" class="fa-tile">
                <span class="fa-tile__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
                        <circle cx="12" cy="5"  r="2.5" fill="currentColor" stroke="none"/>
                        <circle cx="5"  cy="19" r="2.5" fill="currentColor" stroke="none"/>
                        <circle cx="19" cy="19" r="2.5" fill="currentColor" stroke="none"/>
                        <line x1="12" y1="7.5" x2="12" y2="13"/>
                        <line x1="12" y1="13"  x2="5"  y2="16.5"/>
                        <line x1="12" y1="13"  x2="19" y2="16.5"/>
                    </svg>
                </span>
                <span class="fa-tile__name">View the tree</span>
                <span class="fa-tile__desc">Explore the interactive family tree and navigate relationships.</span>
            </a>

            <a href="<?php echo esc_url(home_url('/map')); ?>" class="fa-tile">
                <span class="fa-tile__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                </span>
                <span class="fa-tile__name">View by location</span>
                <span class="fa-tile__desc">Browse family history on an interactive map.</span>
            </a>

            <a href="<?php echo esc_url(home_url('/upload-media')); ?>" class="fa-tile">
                <span class="fa-tile__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 3L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-3.17L15 3H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z"/>
                    </svg>
                </span>
                <span class="fa-tile__name">Upload media</span>
                <span class="fa-tile__desc">Add photos, documents, certificates, and other files.</span>
            </a>

            <a href="<?php echo esc_url(home_url('/add-story')); ?>" class="fa-tile">
                <span class="fa-tile__icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                </span>
                <span class="fa-tile__name">Write a story</span>
                <span class="fa-tile__desc">Preserve a memory, biography chapter, or family narrative.</span>
            </a>

        </div>
    </section>


    <!-- =====================================================================
         Row 3 — Recent additions  +  Upcoming birthdays
         ===================================================================== -->
    <div class="fa-home-bottom">

        <!-- Recent additions -->
        <section class="fa-card" aria-labelledby="fa-recent-heading">
            <div class="fa-section-header">
                <h2 id="fa-recent-heading">Recent additions</h2>
            </div>

            <?php if ($recent->have_posts()) : ?>
                <div class="fa-feed">
                    <?php while ($recent->have_posts()) : $recent->the_post();
                        $ptype = get_post_type();
                        $label = $type_labels[$ptype] ?? $ptype;
                        $author_id   = get_the_author_meta('ID');
                        $author_name = get_the_author();
                        $time_ago    = human_time_diff(get_the_time('U'), current_time('timestamp')) . ' ago';
                    ?>
                    <div class="fa-feed__item">
                        <span class="fa-feed__dot" aria-hidden="true"></span>
                        <div>
                            <div class="fa-feed__text">
                                <span class="fa-badge"><?php echo esc_html($label); ?></span>
                                <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                            </div>
                            <div class="fa-feed__meta">Added by <?php echo esc_html($author_name); ?> &middot; <?php echo esc_html($time_ago); ?></div>
                        </div>
                    </div>
                    <?php endwhile; wp_reset_postdata(); ?>
                </div>
            <?php else : ?>
                <p class="fa-empty-state">Nothing added yet. <a href="<?php echo esc_url(home_url('/add-person')); ?>">Add the first person.</a></p>
            <?php endif; ?>
        </section>

        <!-- Upcoming birthdays -->
        <section class="fa-card" aria-labelledby="fa-birthdays-heading">
            <div class="fa-section-header">
                <h2 id="fa-birthdays-heading">Upcoming birthdays</h2>
                <span class="fa-text-muted fa-text-sm">Next 30 days</span>
            </div>

            <?php if (!empty($upcoming)) : ?>
                <ul class="fa-birthday-list">
                    <?php foreach ($upcoming as $bday) :
                        $person    = $bday['post'];
                        $next_date = $bday['next_date'];
                        $today_dt  = new DateTime('today');
                        $diff      = (int) $today_dt->diff($next_date)->days;
                        if ($diff === 0)      $when = 'Today';
                        elseif ($diff === 1)  $when = 'Tomorrow';
                        else                  $when = 'In ' . $diff . ' days';
                        $is_living = get_field('is_living', $person->ID);
                    ?>
                    <li class="fa-birthday-item">
                        <span class="fa-birthday-when <?php echo $diff === 0 ? 'fa-birthday-when--today' : ''; ?>">
                            <?php echo esc_html($when); ?>
                        </span>
                        <span class="fa-birthday-info">
                            <a href="<?php echo esc_url(get_permalink($person->ID)); ?>"><?php echo esc_html(get_the_title($person->ID)); ?></a>
                            <span class="fa-birthday-date"><?php echo esc_html($next_date->format('F j')); ?><?php echo !$is_living ? ' <span class="fa-birthday-memo">(in memoriam)</span>' : ''; ?></span>
                        </span>
                    </li>
                    <?php endforeach; ?>
                </ul>
            <?php else : ?>
                <p class="fa-empty-state">No birthdays in the next 30 days.</p>
            <?php endif; ?>
        </section>

    </div><!-- /.fa-home-bottom -->

</div><!-- /.fa-home -->

<?php get_footer(); ?>
