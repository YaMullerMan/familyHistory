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

<script>
// Mobile slide-in menu
(function () {
    const btn  = document.getElementById('fa-mobile-menu-btn');
    const menu = document.getElementById('fa-mobile-menu');
    if (!btn || !menu) return;

    function open() {
        menu.hidden = false;
        document.documentElement.classList.add('fa-menu-open');
        btn.setAttribute('aria-expanded', 'true');
        void menu.offsetWidth; // apply the closed position first so the slide-in animates
        menu.classList.add('fa-mobile-menu--open');
        menu.querySelector('.fa-mobile-menu__close').focus();
    }

    function close() {
        if (menu.hidden) return;
        menu.classList.remove('fa-mobile-menu--open');
        document.documentElement.classList.remove('fa-menu-open');
        btn.setAttribute('aria-expanded', 'false');
        // Hide after the slide-out finishes (timer, so it also works with reduced motion)
        setTimeout(() => {
            if (!menu.classList.contains('fa-mobile-menu--open')) menu.hidden = true;
        }, 260);
        btn.focus();
    }

    btn.addEventListener('click', open);
    menu.querySelectorAll('[data-close-menu]').forEach(el => el.addEventListener('click', close));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    // Close if the window grows past the mobile breakpoint
    window.matchMedia('(min-width: 821px)').addEventListener('change', e => {
        if (e.matches) { close(); menu.hidden = true; }
    });
}());
</script>

<?php wp_footer(); ?>
</body>
</html>
