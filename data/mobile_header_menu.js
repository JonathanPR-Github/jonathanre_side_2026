/* ============================================================
   MOBILE HEADER MENU
   ------------------------------------------------------------
   Replaces the two small header navigation buttons with one large
   MENU button on phone-sized screens. The normal desktop header is
   left unchanged.
   ============================================================ */

(function () {
    'use strict';

    var MOBILE_BREAKPOINT = 480;

    function startMobileHeaderMenu() {
        var header = document.querySelector('.header_top');
        var toggle = document.querySelector('.header_mobile_menu_button');
        var menu = document.getElementById('header_mobile_menu');

        if (!header || !toggle || !menu) return;

        function isMobile() {
            return window.innerWidth <= MOBILE_BREAKPOINT;
        }

        function setMenuOpen(open) {
            var shouldOpen = Boolean(open && isMobile());

            header.classList.toggle('mobile_menu_open', shouldOpen);
            toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        }

        toggle.addEventListener('click', function () {
            setMenuOpen(!header.classList.contains('mobile_menu_open'));
        });

        menu.addEventListener('click', function (event) {
            if (event.target.closest('.header_top_button')) {
                setMenuOpen(false);
            }
        });

        document.addEventListener('click', function (event) {
            if (!header.contains(event.target)) {
                setMenuOpen(false);
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                setMenuOpen(false);
                toggle.blur();
            }
        });

        window.addEventListener('resize', function () {
            if (!isMobile()) setMenuOpen(false);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startMobileHeaderMenu);
    } else {
        startMobileHeaderMenu();
    }
}());
