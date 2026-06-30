<?php
/**
 * front-page.php
 *
 * Handles the static front page (Settings → Reading → "A static page").
 * WordPress checks for this file first, bypassing any custom page template
 * assigned to the page. We re-apply the page's assigned template here so
 * custom templates still work when the page is set as the front page.
 */

$page_template = get_page_template_slug(get_queried_object_id());

if ($page_template && ($located = locate_template($page_template))) {
    include $located;
} else {
    include get_theme_file_path('templates/template-home.php');
}
