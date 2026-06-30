</main>

<footer class="fa-footer">
    <div class="fa-footer__inner">
        <p class="fa-footer__copy">&copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?></p>
    </div>
</footer>

<script>
// Avatar dropdown toggle
(function () {
    const btn = document.getElementById('fa-user-menu-btn');
    if (!btn) return;
    const menu = btn.nextElementSibling;
    btn.addEventListener('click', function () {
        const open = menu.hidden;
        menu.hidden = !open;
        btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) {
        if (!btn.contains(e.target) && !menu.contains(e.target)) {
            menu.hidden = true;
            btn.setAttribute('aria-expanded', 'false');
        }
    });
}());
</script>

<?php wp_footer(); ?>
</body>
</html>
