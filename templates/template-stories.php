<?php
/* Template Name: Stories */

// Find the Add a Story page dynamically so the button always links correctly
$add_story_pages = get_posts([
    'post_type'      => 'page',
    'posts_per_page' => 1,
    'meta_key'       => '_wp_page_template',
    'meta_value'     => 'templates/template-add-story.php',
    'fields'         => 'ids',
]);
$add_story_url = $add_story_pages ? get_permalink($add_story_pages[0]) : null;

// Fetch recent stories
$stories_query = new WP_Query([
    'post_type'      => 'fa_story',
    'posts_per_page' => 24,
    'orderby'        => 'date',
    'order'          => 'DESC',
]);

get_header();
?>

<div class="fa-page fa-stories-page">

    <!-- ── Page header ─────────────────────────────────────────────── -->
    <div class="fa-stories-header">
        <div class="fa-stories-header__text">
            <h1>Stories</h1>
            <p>Family memories, histories, and moments preserved in writing.</p>
        </div>
        <?php if ($add_story_url && is_user_logged_in()): ?>
            <a href="<?php echo esc_url($add_story_url); ?>" class="fa-btn fa-btn--primary fa-btn--lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14"/>
                </svg>
                Write a story
            </a>
        <?php endif; ?>
    </div>

    <!-- ── Search ──────────────────────────────────────────────────── -->
    <div class="fa-stories-search">
        <div class="fa-stories-search__wrap">
            <svg class="fa-stories-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="search" id="fa-story-search" class="fa-input fa-stories-search__input"
                placeholder="Search stories…" autocomplete="off">
        </div>
    </div>

    <!-- ── Stories grid ────────────────────────────────────────────── -->
    <div id="fa-stories-grid" class="fa-stories-grid">
        <?php if ($stories_query->have_posts()): ?>
            <?php while ($stories_query->have_posts()): $stories_query->the_post();
                $cover   = get_field('cover_image');
                $date    = get_field('story_date');
                $content = get_field('story_content');
                $people  = get_field('people_featured') ?: [];
                $initial = strtoupper(mb_substr(get_the_title(), 0, 1));
                $excerpt = $content ? mb_strimwidth(wp_strip_all_tags($content), 0, 160, '…') : '';
                $thumb   = $cover ? ($cover['sizes']['medium'] ?? $cover['url']) : null;
                $dt      = $date ? DateTime::createFromFormat('Y-m-d', $date) : null;
            ?>
                <a href="<?php the_permalink(); ?>" class="fa-story-item">
                    <div class="fa-story-item__cover <?php echo $thumb ? '' : 'fa-story-item__cover--placeholder'; ?>">
                        <?php if ($thumb): ?>
                            <img src="<?php echo esc_url($thumb); ?>" alt="<?php the_title_attribute(); ?>">
                        <?php else: ?>
                            <span class="fa-story-item__initial"><?php echo esc_html($initial); ?></span>
                        <?php endif; ?>
                    </div>
                    <div class="fa-story-item__body">
                        <h2 class="fa-story-item__title"><?php the_title(); ?></h2>
                        <?php if ($dt): ?>
                            <div class="fa-story-item__date"><?php echo esc_html($dt->format('j F Y')); ?></div>
                        <?php endif; ?>
                        <?php if ($people): ?>
                            <div class="fa-story-item__people">
                                <?php
                                $shown = array_slice($people, 0, 3);
                                foreach ($shown as $person):
                                ?>
                                    <span class="fa-story-item__person"><?php echo esc_html(get_the_title($person->ID)); ?></span>
                                <?php endforeach;
                                if (count($people) > 3): ?>
                                    <span class="fa-story-item__person fa-story-item__person--more">+<?php echo count($people) - 3; ?></span>
                                <?php endif; ?>
                            </div>
                        <?php endif; ?>
                        <?php if ($excerpt): ?>
                            <p class="fa-story-item__excerpt"><?php echo esc_html($excerpt); ?></p>
                        <?php endif; ?>
                    </div>
                </a>
            <?php endwhile; wp_reset_postdata(); ?>

        <?php else: ?>
            <div class="fa-stories-empty" id="fa-stories-empty-initial">
                <p>No stories yet.</p>
                <?php if ($add_story_url && is_user_logged_in()): ?>
                    <a href="<?php echo esc_url($add_story_url); ?>" class="fa-btn fa-btn--primary">Write the first story</a>
                <?php endif; ?>
            </div>
        <?php endif; ?>
    </div>

    <!-- Search empty state (hidden until needed) -->
    <div id="fa-search-empty" class="fa-stories-empty" hidden>
        <p>No stories matched "<span id="fa-search-empty-term"></span>".</p>
    </div>

</div>

<?php get_footer(); ?>
