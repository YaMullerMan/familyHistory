<?php

define('FA_VERSION', '1.0.0');

// ---------------------------------------------------------------------------
// Theme setup
// ---------------------------------------------------------------------------
function fa_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script']);

    register_nav_menus([
        'fa-primary' => 'Primary Navigation',
    ]);
}
add_action('after_setup_theme', 'fa_setup');

// ---------------------------------------------------------------------------
// Enqueue
// ---------------------------------------------------------------------------
function fa_enqueue() {
    $uri = get_stylesheet_directory_uri();

    wp_enqueue_style('fa-main', $uri . '/assets/css/main.css', [], FA_VERSION);

    if (is_page_template('templates/template-home.php')) {
        wp_enqueue_style('fa-home', $uri . '/assets/css/home.css', ['fa-main'], FA_VERSION);
    }

    if (is_singular('fa_person')) {
        wp_enqueue_style('fa-profile', $uri . '/assets/css/profile.css', ['fa-main'], FA_VERSION);
    }

    if (is_page_template('templates/template-tree.php')) {
        wp_enqueue_style('fa-tree',  $uri . '/assets/css/tree.css',  ['fa-main'], FA_VERSION);
        wp_enqueue_script('fa-tree', $uri . '/assets/js/tree.js',    ['fa-api'],  FA_VERSION, true);
    }

    if (is_page_template('templates/template-stories.php')) {
        wp_enqueue_style('fa-stories',  $uri . '/assets/css/stories.css',  ['fa-main'], FA_VERSION);
        wp_enqueue_script('fa-stories', $uri . '/assets/js/stories.js',    ['fa-api'],  FA_VERSION, true);
    }

    if (is_page_template('templates/template-people.php')) {
        wp_enqueue_style('fa-people',  $uri . '/assets/css/people.css',  ['fa-main'], FA_VERSION);
        wp_enqueue_script('fa-people', $uri . '/assets/js/people.js',    ['fa-api'],  FA_VERSION, true);
    }

    if (is_page_template('templates/template-map.php')) {
        wp_enqueue_style('leaflet',  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', [], '1.9.4');
        wp_enqueue_style('fa-map',   $uri . '/assets/css/map.css', ['fa-main', 'leaflet'], FA_VERSION);
        wp_enqueue_script('leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', [], '1.9.4', true);
        wp_enqueue_script('fa-map',  $uri . '/assets/js/map.js', ['fa-api', 'leaflet'], FA_VERSION, true);
    }

    $form_templates = [
        'templates/template-add-person.php',
        'templates/template-add-location.php',
        'templates/template-add-event.php',
        'templates/template-add-story.php',
        'templates/template-upload-media.php',
    ];
    if (is_page_template($form_templates)) {
        wp_enqueue_style('fa-forms', $uri . '/assets/css/forms.css', ['fa-main'], FA_VERSION);
    }

    wp_enqueue_script('fa-api', $uri . '/assets/js/api.js', [], FA_VERSION, true);

    if (is_page_template($form_templates)) {
        wp_enqueue_script('fa-live-search', $uri . '/assets/js/live-search.js',     ['fa-api'], FA_VERSION, true);
        wp_enqueue_script('fa-file-upload', $uri . '/assets/js/file-upload.js',     ['fa-api'], FA_VERSION, true);
        wp_enqueue_script('fa-multi-step',  $uri . '/assets/js/multi-step-form.js', ['fa-api'], FA_VERSION, true);
    }

    if (is_page_template('templates/template-add-person.php')) {
        wp_enqueue_script('fa-add-person', $uri . '/assets/js/add-person.js',
            ['fa-live-search', 'fa-file-upload', 'fa-multi-step'], FA_VERSION, true);
    }

    if (is_page_template('templates/template-add-story.php')) {
        wp_enqueue_script('fa-add-story', $uri . '/assets/js/add-story.js',
            ['fa-live-search', 'fa-file-upload', 'fa-multi-step'], FA_VERSION, true);
    }

    wp_localize_script('fa-api', 'FA_CONFIG', [
        'apiBase'     => esc_url(rest_url()),
        'nonce'       => wp_create_nonce('wp_rest'),
        'currentUser' => get_current_user_id(),
        'themeUri'    => $uri,
        'siteUrl'     => get_site_url(),
    ]);
}
add_action('wp_enqueue_scripts', 'fa_enqueue');

// ---------------------------------------------------------------------------
// Custom Post Types
// ---------------------------------------------------------------------------
function fa_register_post_types() {

    // fa_person ---------------------------------------------------------------
    register_post_type('fa_person', [
        'labels' => [
            'name'          => 'People',
            'singular_name' => 'Person',
            'add_new_item'  => 'Add New Person',
            'edit_item'     => 'Edit Person',
            'view_item'     => 'View Person',
            'search_items'  => 'Search People',
            'not_found'     => 'No people found',
        ],
        'public'       => true,
        'has_archive'  => true,
        'show_in_rest' => true,
        'rest_base'    => 'fa_person',
        'supports'     => ['title', 'editor', 'thumbnail', 'revisions'],
        'menu_icon'    => 'dashicons-admin-users',
        'rewrite'      => ['slug' => 'person'],
    ]);

    // fa_location -------------------------------------------------------------
    register_post_type('fa_location', [
        'labels' => [
            'name'          => 'Locations',
            'singular_name' => 'Location',
            'add_new_item'  => 'Add New Location',
            'edit_item'     => 'Edit Location',
            'view_item'     => 'View Location',
            'search_items'  => 'Search Locations',
            'not_found'     => 'No locations found',
        ],
        'public'       => true,
        'has_archive'  => true,
        'show_in_rest' => true,
        'rest_base'    => 'fa_location',
        'supports'     => ['title', 'editor', 'thumbnail', 'revisions'],
        'menu_icon'    => 'dashicons-location',
        'rewrite'      => ['slug' => 'location'],
    ]);

    // fa_event ----------------------------------------------------------------
    register_post_type('fa_event', [
        'labels' => [
            'name'          => 'Events',
            'singular_name' => 'Event',
            'add_new_item'  => 'Add New Event',
            'edit_item'     => 'Edit Event',
            'view_item'     => 'View Event',
            'search_items'  => 'Search Events',
            'not_found'     => 'No events found',
        ],
        'public'       => true,
        'has_archive'  => true,
        'show_in_rest' => true,
        'rest_base'    => 'fa_event',
        'supports'     => ['title', 'editor', 'thumbnail', 'revisions'],
        'menu_icon'    => 'dashicons-calendar-alt',
        'rewrite'      => ['slug' => 'event'],
    ]);

    // fa_story ----------------------------------------------------------------
    register_post_type('fa_story', [
        'labels' => [
            'name'          => 'Stories',
            'singular_name' => 'Story',
            'add_new_item'  => 'Add New Story',
            'edit_item'     => 'Edit Story',
            'view_item'     => 'View Story',
            'search_items'  => 'Search Stories',
            'not_found'     => 'No stories found',
        ],
        'public'       => true,
        'has_archive'  => true,
        'show_in_rest' => true,
        'rest_base'    => 'fa_story',
        'supports'     => ['title', 'editor', 'thumbnail', 'revisions'],
        'menu_icon'    => 'dashicons-book',
        'rewrite'      => ['slug' => 'story'],
    ]);

    // fa_media ----------------------------------------------------------------
    register_post_type('fa_media', [
        'labels' => [
            'name'          => 'Media items',
            'singular_name' => 'Media item',
            'add_new_item'  => 'Add New Media Item',
            'edit_item'     => 'Edit Media Item',
            'view_item'     => 'View Media Item',
            'search_items'  => 'Search Media',
            'not_found'     => 'No media found',
        ],
        'public'       => true,
        'has_archive'  => true,
        'show_in_rest' => true,
        'rest_base'    => 'fa_media',
        'supports'     => ['title', 'editor', 'thumbnail', 'revisions'],
        'menu_icon'    => 'dashicons-format-image',
        'rewrite'      => ['slug' => 'media-item'],
    ]);
}
add_action('init', 'fa_register_post_types');

// ---------------------------------------------------------------------------
// Taxonomy: fa_branch (family branch / surname line)
// ---------------------------------------------------------------------------
function fa_register_taxonomies() {
    register_taxonomy('fa_branch', ['fa_person'], [
        'labels' => [
            'name'          => 'Family branches',
            'singular_name' => 'Family branch',
            'search_items'  => 'Search branches',
            'all_items'     => 'All branches',
            'edit_item'     => 'Edit branch',
            'add_new_item'  => 'Add new branch',
        ],
        'public'       => true,
        'hierarchical' => false,
        'show_in_rest' => true,
        'rewrite'      => ['slug' => 'branch'],
    ]);
}
add_action('init', 'fa_register_taxonomies');

// ---------------------------------------------------------------------------
// Register the `acf` field on all FA post types for REST API access.
// Free ACF doesn't do this automatically — we wire it up manually.
// Relies on ACF Local JSON loading field definitions from /acf-json/.
// ---------------------------------------------------------------------------
function fa_register_acf_rest_fields() {
    $post_types = ['fa_person', 'fa_location', 'fa_event', 'fa_story', 'fa_media'];

    foreach ($post_types as $post_type) {
        register_rest_field($post_type, 'acf', [

            'get_callback' => function ($post_arr) {
                if (!function_exists('get_fields')) {
                    return null;
                }
                $raw = get_fields($post_arr['id']);
                if (!$raw) {
                    return null;
                }
                // Flatten WP_Post objects in relationship fields down to IDs
                // so the response serialises cleanly.
                $result = [];
                foreach ($raw as $key => $value) {
                    if (is_array($value)) {
                        $result[$key] = array_map(
                            fn($v) => ($v instanceof WP_Post) ? $v->ID : $v,
                            $value
                        );
                    } elseif ($value instanceof WP_Post) {
                        $result[$key] = $value->ID;
                    } else {
                        $result[$key] = $value;
                    }
                }
                return $result;
            },

            'update_callback' => function ($acf_data, $post_obj) {
                if (!function_exists('update_field') || !is_array($acf_data)) {
                    return;
                }
                foreach ($acf_data as $field_name => $value) {
                    update_field($field_name, $value, $post_obj->ID);
                }
            },

            'schema' => [
                'description'          => 'ACF custom fields',
                'type'                 => 'object',
                'context'              => ['view', 'edit'],
                'additionalProperties' => true,
            ],

        ]);
    }
}
add_action('rest_api_init', 'fa_register_acf_rest_fields');

// ---------------------------------------------------------------------------
// Member role — can create/edit their own fa_* posts, cannot access wp-admin
// ---------------------------------------------------------------------------
function fa_register_roles() {
    if (get_role('fa_member')) {
        return;
    }
    add_role('fa_member', 'Archive Member', [
        'read'                     => true,
        'create_posts'             => true,
        'edit_posts'               => true,
        'edit_published_posts'     => true,
        'delete_posts'             => false,
        'upload_files'             => true,
    ]);
}
add_action('init', 'fa_register_roles');

// Block wp-admin access for fa_member role
function fa_block_admin_for_members() {
    if (is_admin() && !defined('DOING_AJAX') && current_user_can('fa_member') && !current_user_can('edit_others_posts')) {
        wp_redirect(home_url('/'));
        exit;
    }
}
add_action('admin_init', 'fa_block_admin_for_members');

// ---------------------------------------------------------------------------
// REST API — allow cookie/nonce auth for logged-in front-end requests
// ---------------------------------------------------------------------------
function fa_rest_allow_cookie_auth($result) {
    if (!empty($result)) {
        return $result;
    }
    if (is_user_logged_in()) {
        return true;
    }
    return $result;
}
add_filter('rest_authentication_errors', 'fa_rest_allow_cookie_auth');

// ---------------------------------------------------------------------------
// ACF JSON sync directory
// ---------------------------------------------------------------------------
function fa_acf_json_save($path) {
    return get_stylesheet_directory() . '/acf-json';
}
add_filter('acf/settings/save_json', 'fa_acf_json_save');

function fa_acf_json_load($paths) {
    $paths[] = get_stylesheet_directory() . '/acf-json';
    return $paths;
}
add_filter('acf/settings/load_json', 'fa_acf_json_load');

// ---------------------------------------------------------------------------
// "Today in family history" helper — callable from templates
// ---------------------------------------------------------------------------
function fa_get_today_in_history() {
    $month = date('m');
    $day   = date('d');
    $pad   = "-{$month}-{$day}";

    $birthdays = new WP_Query([
        'post_type'      => 'fa_person',
        'posts_per_page' => 10,
        'meta_query'     => [['key' => 'birth_date', 'value' => $pad, 'compare' => 'LIKE']],
    ]);

    $anniversaries = new WP_Query([
        'post_type'      => 'fa_event',
        'posts_per_page' => 10,
        'meta_query'     => [['key' => 'event_date', 'value' => $pad, 'compare' => 'LIKE']],
    ]);

    return [
        'birthdays'     => $birthdays->posts,
        'anniversaries' => $anniversaries->posts,
    ];
}

// ---------------------------------------------------------------------------
// Upcoming birthdays helper — next $days days
// ---------------------------------------------------------------------------
function fa_get_upcoming_birthdays($days = 30) {
    $people = get_posts([
        'post_type'      => 'fa_person',
        'posts_per_page' => -1,
        'meta_key'       => 'birth_date',
        'meta_compare'   => 'EXISTS',
    ]);

    $upcoming = [];
    $today    = new DateTime('today');
    $end      = (new DateTime('today'))->modify("+{$days} days");

    foreach ($people as $person) {
        $birth = get_field('birth_date', $person->ID);
        if (!$birth) {
            continue;
        }
        // birth_date stored as Y-m-d; swap to this year
        [$y, $m, $d] = explode('-', $birth);
        $this_year   = new DateTime(date('Y') . "-{$m}-{$d}");
        if ($this_year < $today) {
            $this_year->modify('+1 year');
        }
        if ($this_year <= $end) {
            $upcoming[] = [
                'post'       => $person,
                'next_date'  => $this_year,
                'birth_date' => $birth,
            ];
        }
    }

    usort($upcoming, fn($a, $b) => $a['next_date'] <=> $b['next_date']);
    return $upcoming;
}

// ---------------------------------------------------------------------------
// Archive stats helper — for the "at a glance" cards on home
// ---------------------------------------------------------------------------
function fa_get_archive_stats() {
    return [
        'people'    => wp_count_posts('fa_person')->publish,
        'locations' => wp_count_posts('fa_location')->publish,
        'events'    => wp_count_posts('fa_event')->publish,
        'stories'   => wp_count_posts('fa_story')->publish,
        'media'     => wp_count_posts('fa_media')->publish,
    ];
}
