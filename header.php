<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="fa-nav">
    <div class="fa-nav__inner">

        <a href="<?php echo esc_url(home_url('/')); ?>" class="fa-nav__brand">
            <!-- <svg class="fa-nav__logo" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle cx="14" cy="6" r="3" fill="currentColor"/>
                <circle cx="6"  cy="20" r="3" fill="currentColor"/>
                <circle cx="22" cy="20" r="3" fill="currentColor"/>
                <line x1="14" y1="9"  x2="14" y2="14" stroke="currentColor" stroke-width="1.5"/>
                <line x1="14" y1="14" x2="6"  y2="17" stroke="currentColor" stroke-width="1.5"/>
                <line x1="14" y1="14" x2="22" y2="17" stroke="currentColor" stroke-width="1.5"/>
            </svg> -->
            <svg viewBox="0 0 1024 1024" width="30" height="30" class="icon" version="1.1" xmlns="http://www.w3.org/2000/svg" fill="#000000">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                    <path d="M212.06 633.49c35.65 113.16 481.39 205.46 602-56.32C877.61 439.2 719 63 533 70.78c-132 5.49-407 289.43-320.94 562.71z" fill="#3B6D11"></path>
                    <path d="M363.47 596.15s74.41 80.23 115.75 96.76l-18.6 260.43h94S542.25 635 539.15 596.8c-0.26-3.26 89.91-123 89.91-123l-99 70-16.74-180.56S493.68 575.1 486.45 634z" fill="#d1bf9c"></path>
                </g>
            </svg>
            <span class="fa-nav__site-name"><?php bloginfo('name'); ?></span>
        </a>

        <nav class="fa-nav__links" aria-label="Main navigation">
            <a href="<?php echo esc_url(home_url('/')); ?>"<?php echo is_front_page() ? ' aria-current="page"' : ''; ?>>Home</a>
            <a href="<?php echo esc_url(home_url('/family-tree')); ?>">Tree</a>
            <a href="<?php echo esc_url(home_url('/people')); ?>">People</a>
            <a href="<?php echo esc_url(home_url('/map')); ?>">Places</a>
            <a href="<?php echo esc_url(home_url('/media')); ?>">Media</a>
            <a href="<?php echo esc_url(home_url('/stories')); ?>">Stories</a>
        </nav>

        <div class="fa-nav__user">
            <?php if (is_user_logged_in()) :
                $user   = wp_get_current_user();
                $avatar = get_avatar_url($user->ID, ['size' => 32]);
            ?>
                <button class="fa-nav__avatar-btn" aria-haspopup="true" aria-expanded="false" id="fa-user-menu-btn">
                    <img src="<?php echo esc_url($avatar); ?>" alt="<?php echo esc_attr($user->display_name); ?>" class="fa-nav__avatar" width="32" height="32">
                </button>
                <div class="fa-nav__user-dropdown" role="menu" aria-labelledby="fa-user-menu-btn" hidden>
                    <span class="fa-nav__user-name"><?php echo esc_html($user->display_name); ?></span>
                    <a href="<?php echo esc_url(get_edit_profile_url()); ?>" role="menuitem">Profile</a>
                    <a href="<?php echo esc_url(wp_logout_url(home_url('/'))); ?>" role="menuitem">Sign out</a>
                </div>
            <?php else : ?>
                <a href="<?php echo esc_url(wp_login_url()); ?>" class="fa-btn fa-btn--sm">Sign in</a>
            <?php endif; ?>
        </div>

    </div>
</header>

<main class="fa-main">
