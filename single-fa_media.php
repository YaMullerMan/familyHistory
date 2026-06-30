<?php
$media_id = get_the_ID();
$title    = get_the_title($media_id);
$type     = get_field('media_type',     $media_id);
$date     = get_field('date_circa',     $media_id);
$photo    = get_field('photo',          $media_id);
$file     = get_field('file',           $media_id);
$caption  = get_field('caption',        $media_id);
$people   = get_field('people_in_media', $media_id) ?: [];
$location = get_field('location',       $media_id);
$event    = get_field('event',          $media_id);

$type_labels = [
    'photo'       => 'Photo',
    'document'    => 'Document',
    'video'       => 'Video',
    'certificate' => 'Certificate',
    'newspaper'   => 'Newspaper clipping',
];

get_header();
?>

<div class="fa-page fa-media-single">

    <?php if ($photo): ?>
    <div class="fa-media-single__image">
        <img src="<?php echo esc_url($photo['url']); ?>"
             alt="<?php echo esc_attr($photo['alt'] ?: $title); ?>">
    </div>
    <?php elseif ($file): ?>
    <div class="fa-media-single__file-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
        </svg>
        <a href="<?php echo esc_url($file['url']); ?>" class="fa-btn fa-btn--primary" download>
            Download <?php echo esc_html($file['filename']); ?>
        </a>
    </div>
    <?php endif; ?>

    <div class="fa-media-single__body">

        <header class="fa-media-single__header">
            <?php if ($type): ?>
            <span class="fa-media-single__type"><?php echo esc_html($type_labels[$type] ?? $type); ?></span>
            <?php endif; ?>
            <h1 class="fa-media-single__title"><?php echo esc_html($title); ?></h1>
        </header>

        <dl class="fa-story-meta">

            <?php if ($date): ?>
            <div class="fa-story-meta__row">
                <dt>Date</dt>
                <dd><?php echo esc_html($date); ?></dd>
            </div>
            <?php endif; ?>

            <?php if ($people): ?>
            <div class="fa-story-meta__row">
                <dt>People</dt>
                <dd class="fa-story-meta__links">
                    <?php foreach ($people as $p):
                        if (!($p instanceof WP_Post)) continue;
                        $fn   = get_field('first_name', $p->ID);
                        $ln   = get_field('last_name',  $p->ID);
                        $name = trim("$fn $ln") ?: get_the_title($p->ID);
                    ?>
                        <a href="<?php echo esc_url(get_permalink($p->ID)); ?>"
                           class="fa-story-meta__person"><?php echo esc_html($name); ?></a>
                    <?php endforeach; ?>
                </dd>
            </div>
            <?php endif; ?>

            <?php
            $loc_obj = is_array($location) ? null : $location;
            if (!$loc_obj && is_array($location) && !empty($location)) $loc_obj = $location[0];
            if ($loc_obj instanceof WP_Post):
                $city  = get_field('city',           $loc_obj->ID);
                $state = get_field('state_province', $loc_obj->ID);
                $label = implode(', ', array_filter([$city, $state])) ?: get_the_title($loc_obj->ID);
            ?>
            <div class="fa-story-meta__row">
                <dt>Location</dt>
                <dd><span class="fa-story-meta__location"><?php echo esc_html($label); ?></span></dd>
            </div>
            <?php endif; ?>

            <?php
            $ev_obj = is_array($event) ? null : $event;
            if (!$ev_obj && is_array($event) && !empty($event)) $ev_obj = $event[0];
            if ($ev_obj instanceof WP_Post):
            ?>
            <div class="fa-story-meta__row">
                <dt>Event</dt>
                <dd>
                    <a href="<?php echo esc_url(get_permalink($ev_obj->ID)); ?>"
                       class="fa-story-meta__person"><?php echo esc_html(get_the_title($ev_obj->ID)); ?></a>
                </dd>
            </div>
            <?php endif; ?>

            <?php if ($file && $photo): ?>
            <div class="fa-story-meta__row">
                <dt>File</dt>
                <dd>
                    <a href="<?php echo esc_url($file['url']); ?>"
                       class="fa-media-single__download" download>
                        <?php echo esc_html($file['filename']); ?>
                    </a>
                </dd>
            </div>
            <?php endif; ?>

        </dl>

        <?php if ($caption): ?>
        <div class="fa-media-single__caption">
            <?php echo nl2br(esc_html($caption)); ?>
        </div>
        <?php endif; ?>

    </div>

</div>

<?php get_footer(); ?>
