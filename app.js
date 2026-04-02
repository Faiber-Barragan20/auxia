/* ============================================
   Auxia — SPA Router
   ============================================ */

(function () {
    'use strict';

    // Route → metadata mapping
    var ROUTES = {
        'inicio': {
            title: 'Auxia — Tu negocio gestionado por WhatsApp con IA | Colombia',
            description: 'Auxia atiende tu WhatsApp, agenda citas y gestiona tu negocio automáticamente. Para cualquier negocio colombiano que dependa de su agenda.'
        },
        'condiciones': {
            title: 'Condiciones del Servicio — Auxia',
            description: 'Términos y condiciones del servicio de Auxia.'
        },
        'privacidad': {
            title: 'Política de Privacidad — Auxia',
            description: 'Política de Privacidad y manejo de datos de Auxia.'
        },
        'eliminacion-datos': {
            title: 'Eliminación de Datos — Auxia',
            description: 'Instrucciones sobre cómo solicitar la eliminación de datos.'
        }
    };

    /**
     * Extract the current route name from window.location.hash.
     * Returns 'inicio' if no hash or unrecognized route.
     */
    function getCurrentRoute() {
        var hash = window.location.hash.replace('#/', '').replace('#', '');
        return ROUTES[hash] ? hash : 'inicio';
    }

    /**
     * Show the view matching `route`, hide all others with a smooth fade.
     */
    function navigateTo(route) {
        var views = document.querySelectorAll('.spa-view');

        // 1. Fade-out current visible view
        views.forEach(function (v) {
            if (v.classList.contains('active')) {
                v.classList.remove('visible');
            }
        });

        // 2. After fade-out, swap display and fade-in the new view
        setTimeout(function () {
            views.forEach(function (v) {
                var isTarget = v.getAttribute('data-view') === route;
                if (isTarget) {
                    v.classList.add('active');
                    // Force a reflow so the browser registers display:block before adding opacity
                    void v.offsetWidth;
                    v.classList.add('visible');
                } else {
                    v.classList.remove('active', 'visible');
                }
            });
        }, 150); // half the CSS transition duration for snappy feel

        // 3. Update <title> and <meta description>
        var meta = ROUTES[route];
        if (meta) {
            document.title = meta.title;
            var descTag = document.querySelector('meta[name="description"]');
            if (descTag) descTag.setAttribute('content', meta.description);
        }

        // 4. Update active link styles in nav, mobile menu, and footer
        updateActiveLinks(route);

        // 5. Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // 6. Close mobile menu if open
        closeMobileMenu();
    }

    /**
     * Update nav/footer link styles to highlight the active route.
     */
    function updateActiveLinks(route) {
        // Desktop nav links
        document.querySelectorAll('[data-nav-link]').forEach(function (link) {
            var linkRoute = link.getAttribute('data-nav-link');
            if (linkRoute === route) {
                link.classList.remove('text-slate-300', 'hover:text-primary', 'font-medium');
                link.classList.add('text-primary', 'font-semibold');
            } else {
                link.classList.remove('text-primary', 'font-semibold');
                link.classList.add('text-slate-300', 'hover:text-primary', 'font-medium');
            }
        });

        // Mobile nav links
        document.querySelectorAll('[data-mobile-link]').forEach(function (link) {
            var linkRoute = link.getAttribute('data-mobile-link');
            if (linkRoute === route) {
                link.classList.remove('text-slate-300', 'hover:text-primary', 'font-medium');
                link.classList.add('text-primary', 'font-semibold');
            } else {
                link.classList.remove('text-primary', 'font-semibold');
                link.classList.add('text-slate-300', 'hover:text-primary', 'font-medium');
            }
        });

        // Footer links
        document.querySelectorAll('[data-footer-link]').forEach(function (link) {
            var linkRoute = link.getAttribute('data-footer-link');
            if (linkRoute === route) {
                link.classList.remove('text-slate-400', 'hover:text-white');
                link.classList.add('text-white');
            } else {
                link.classList.remove('text-white');
                link.classList.add('text-slate-400', 'hover:text-white');
            }
        });
    }

    /**
     * Mobile menu toggle + close helper.
     */
    function closeMobileMenu() {
        var menu = document.getElementById('mobile-menu');
        var btn = document.getElementById('mobile-menu-btn');
        if (menu && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
            if (btn) {
                var icon = btn.querySelector('.material-symbols-outlined');
                if (icon) icon.textContent = 'menu';
            }
        }
    }

    function initMobileMenu() {
        var btn = document.getElementById('mobile-menu-btn');
        if (!btn) return;
        btn.addEventListener('click', function () {
            var menu = document.getElementById('mobile-menu');
            var icon = this.querySelector('.material-symbols-outlined');
            if (menu.classList.contains('hidden')) {
                menu.classList.remove('hidden');
                icon.textContent = 'close';
            } else {
                menu.classList.add('hidden');
                icon.textContent = 'menu';
            }
        });
    }

    /**
     * Chrome/Blink performance detection
     */
    function detectChrome() {
        var isChromium = !!window.chrome;
        if (isChromium) {
            document.body.classList.add('chrome-perf');
        }
    }

    // ---- Bootstrap ----
    function init() {
        detectChrome();
        initMobileMenu();

        // Initial navigation based on current hash
        var route = getCurrentRoute();
        // Set hash if none present (so bookmarking works)
        if (!window.location.hash) {
            history.replaceState(null, '', '#/inicio');
        }
        navigateTo(route);

        // Listen for hash changes (back/forward buttons, link clicks)
        window.addEventListener('hashchange', function () {
            navigateTo(getCurrentRoute());
        });
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
