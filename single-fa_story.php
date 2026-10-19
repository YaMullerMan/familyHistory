<?php
$story_id = get_the_ID();

$title     = get_the_title($story_id);
$content   = get_field('story_content',       $story_id);
$date      = get_field('story_date',          $story_id);
$cover     = get_field('cover_image',         $story_id);
$people    = get_field('people_featured',     $story_id) ?: [];
$locations = get_field('locations_featured',  $story_id) ?: [];
$author    = get_field('author_person',       $story_id) ?: [];

function fa_s_fmt_date($d) {
    if (!$d) return null;
    $dt = DateTime::createFromFormat('Y-m-d', $d);
    return $dt ? $dt->format('F j, Y') : $d;
}

get_header();
?>

<div class="fa-page fa-story-page">

    <?php if ($cover): ?>
    <div class="fa-story-cover">
        <img src="<?php echo esc_url($cover['url']); ?>"
             alt="<?php echo esc_attr($cover['alt'] ?: $title); ?>">
    </div>
    <?php endif; ?>

    <div class="fa-story-body">

        <header class="fa-story-header">
            <div class="fa-story-header__top">
                <h1 class="fa-story-header__title"><?php echo esc_html($title); ?></h1>

                <?php if (current_user_can('edit_post', $story_id)):
                    $add_story_pages = get_posts([
                        'post_type'      => 'page',
                        'posts_per_page' => 1,
                        'meta_key'       => '_wp_page_template',
                        'meta_value'     => 'templates/template-add-story.php',
                        'fields'         => 'ids',
                    ]);
                    $edit_url = $add_story_pages
                        ? add_query_arg('edit', $story_id, get_permalink($add_story_pages[0]))
                        : get_edit_post_link($story_id);
                ?>
                    <div class="fa-profile-actions">
                        <a href="<?php echo esc_url($edit_url); ?>" class="fa-btn fa-btn--secondary fa-btn--sm">Edit</a>
                    </div>
                <?php endif; ?>
            </div>

            <dl class="fa-story-meta">

                <?php if ($date): ?>
                <div class="fa-story-meta__row">
                    <dt>Date</dt>
                    <dd><?php echo esc_html(fa_s_fmt_date($date)); ?></dd>
                </div>
                <?php endif; ?>

                <?php if ($people): ?>
                <div class="fa-story-meta__row">
                    <dt>People</dt>
                    <dd class="fa-story-meta__links">
                        <?php foreach ($people as $p):
                            if (!($p instanceof WP_Post)) continue;
                            $fn = get_field('first_name', $p->ID);
                            $ln = get_field('last_name',  $p->ID);
                            $name = trim("$fn $ln") ?: get_the_title($p->ID);
                        ?>
                            <a href="<?php echo esc_url(get_permalink($p->ID)); ?>"
                               class="fa-story-meta__person"><?php echo esc_html($name); ?></a>
                        <?php endforeach; ?>
                    </dd>
                </div>
                <?php endif; ?>

                <?php if ($locations): ?>
                <div class="fa-story-meta__row">
                    <dt>Location</dt>
                    <dd class="fa-story-meta__links">
                        <?php foreach ($locations as $loc):
                            if (!($loc instanceof WP_Post)) continue;
                            $city  = get_field('city',           $loc->ID);
                            $state = get_field('state_province', $loc->ID);
                            $label = implode(', ', array_filter([$city, $state])) ?: get_the_title($loc->ID);
                        ?>
                            <span class="fa-story-meta__location"><?php echo esc_html($label); ?></span>
                        <?php endforeach; ?>
                    </dd>
                </div>
                <?php endif; ?>

            </dl>
        </header>

        <?php if ($content): ?>
        <div class="fa-story-content fa-profile-bio">
            <?php echo wp_kses_post($content); ?>
        </div>
        <?php endif; ?>

    </div>

</div>

<?php get_footer(); ?>
