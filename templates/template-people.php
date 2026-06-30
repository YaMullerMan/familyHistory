<?php
/* Template Name: People */

$add_person_pages = get_posts([
    'post_type'      => 'page',
    'posts_per_page' => 1,
    'meta_key'       => '_wp_page_template',
    'meta_value'     => 'templates/template-add-person.php',
    'fields'         => 'ids',
]);
$add_person_url = $add_person_pages ? get_permalink($add_person_pages[0]) : null;

// Fetch all people ordered by last name then first name
$people_query = new WP_Query([
    'post_type'      => 'fa_person',
    'posts_per_page' => -1,
    'meta_key'       => 'last_name',
    'orderby'        => ['meta_value' => 'ASC', 'title' => 'ASC'],
]);

// Group by first letter of last name
$grouped = [];
if ($people_query->have_posts()) {
    while ($people_query->have_posts()) {
        $people_query->the_post();
        $last   = get_field('last_name') ?: get_the_title();
        $letter = strtoupper(mb_substr(trim($last), 0, 1)) ?: '#';
        $grouped[$letter][] = get_post();
    }
    wp_reset_postdata();
    ksort($grouped);
}

get_header();
?>

<div class="fa-page fa-people-page">

    <!-- ── Header ──────────────────────────────────────────────────── -->
    <div class="fa-people-header">
        <div class="fa-people-header__text">
            <h1>People</h1>
            <p><?php echo array_sum(array_map('count', $grouped)); ?> people in the archive</p>
        </div>
        <?php if ($add_person_url && is_user_logged_in()): ?>
            <a href="<?php echo esc_url($add_person_url); ?>" class="fa-btn fa-btn--primary fa-btn--lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                Add a person
            </a>
        <?php endif; ?>
    </div>

    <!-- ── Search ──────────────────────────────────────────────────── -->
    <div class="fa-people-search">
        <div class="fa-people-search__wrap">
            <svg class="fa-people-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="search" id="fa-people-search" class="fa-input fa-people-search__input"
                placeholder="Search by name…" autocomplete="off">
        </div>
    </div>

    <!-- ── Alphabetical list ───────────────────────────────────────── -->
    <div id="fa-people-list">
        <?php if ($grouped): foreach ($grouped as $letter => $people): ?>

            <div class="fa-alpha-section">
                <div class="fa-alpha-letter" aria-hidden="true"><?php echo esc_html($letter); ?></div>
                <ul class="fa-person-list">
                    <?php foreach ($people as $person):
                        $pid        = $person->ID;
                        $first      = get_field('first_name',    $pid);
                        $last       = get_field('last_name',     $pid);
                        $maiden     = get_field('maiden_name',   $pid);
                        $is_living  = get_field('is_living',     $pid);
                        $birth      = get_field('birth_date',    $pid);
                        $death      = get_field('death_date',    $pid);
                        $photo      = get_field('profile_photo', $pid);
                        $branches   = get_the_terms($pid, 'fa_branch') ?: [];
                        $birth_year = $birth ? substr($birth, 0, 4) : null;
                        $death_year = $death ? substr($death, 0, 4) : null;
                        $thumb      = $photo ? ($photo['sizes']['thumbnail'] ?? $photo['url']) : null;
                        $initials   = strtoupper(($first ? $first[0] : '') . ($last ? $last[0] : ''));
                        $full_name  = implode(' ', array_filter([$first, $last])) ?: get_the_title($pid);
                    ?>
                        <li>
                            <a href="<?php echo esc_url(get_permalink($pid)); ?>" class="fa-person-row<?php echo !$is_living ? ' fa-person-row--deceased' : ''; ?>">

                                <span class="fa-person-row__avatar">
                                    <?php if ($thumb): ?>
                                        <img src="<?php echo esc_url($thumb); ?>" alt="">
                                    <?php else: ?>
                                        <span class="fa-person-row__initials"><?php echo esc_html($initials ?: '?'); ?></span>
                                    <?php endif; ?>
                                </span>

                                <span class="fa-person-row__name">
                                    <?php echo esc_html($full_name); ?>
                                    <?php if ($maiden): ?>
                                        <span class="fa-person-row__maiden">née <?php echo esc_html($maiden); ?></span>
                                    <?php endif; ?>
                                </span>

                                <span class="fa-person-row__meta">
                                    <?php if ($birth_year): ?>
                                        <span class="fa-person-row__years">
                                            <?php if ($death_year): ?>
                                                <?php echo esc_html("{$birth_year}–{$death_year}"); ?>
                                            <?php else: ?>
                                                b. <?php echo esc_html($birth_year); ?>
                                            <?php endif; ?>
                                        </span>
                                    <?php endif; ?>
                                    <?php foreach (array_slice($branches, 0, 2) as $branch): ?>
                                        <span class="fa-badge"><?php echo esc_html($branch->name); ?></span>
                                    <?php endforeach; ?>
                                </span>

                            </a>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>

        <?php endforeach; else: ?>
            <div class="fa-people-empty" id="fa-people-empty-initial">
                <p>No people in the archive yet.</p>
                <?php if ($add_person_url && is_user_logged_in()): ?>
                    <a href="<?php echo esc_url($add_person_url); ?>" class="fa-btn fa-btn--primary">Add the first person</a>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>

    <div id="fa-search-empty" class="fa-people-empty" hidden>
        No results for "<span id="fa-search-empty-term"></span>".
    </div>

</div>

<?php get_footer(); ?>
