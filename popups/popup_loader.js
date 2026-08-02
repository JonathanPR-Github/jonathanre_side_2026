/* ============================================================
   POPUP LOADER
   ------------------------------------------------------------
   Lets popup content live in separate files instead of index.html.

   How to use:
     1. In index.html, leave the wrapper div but empty it out, and
        point it at a file:

            <div class="timeline_popup_content"
                 id="container_popup_1"
                 data-popup-src="popups/popup_1.html"></div>

     2. Put the markup that used to be inside that div into
        popups/popup_1.html.

   Nothing else changes. The buttons keep calling popup(1), the CSS
   keeps working (class + id stay on the wrapper), and popups without
   a data-popup-src attribute are left completely alone.

   NOTE: this uses fetch(), which browsers block on file:// URLs.
   The site must be opened through a web server (GitHub Pages,
   VS Code "Live Server", or: python -m http.server 8000).
   ============================================================ */

(function () {
    'use strict';

    /* ---------- load one fragment ---------- */

    function loadFragment(el) {
        if (el._popupPromise) return el._popupPromise;

        var src = el.getAttribute('data-popup-src');
        if (!src) return Promise.resolve();

        el._popupPromise = fetch(src)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error(response.status + ' ' + response.statusText);
                }
                return response.text();
            })
            .then(function (html) {
                el.innerHTML = html;
            })
            .catch(function (error) {
                console.error('[popup_loader] could not load "' + src + '":', error);
                el.innerHTML =
                    '<div class="timeline_popup_textbox">' +
                        '<div class="timeline_popup_textbox_inner">' +
                            '<div class="timeline_popup_text_content">' +
                                '<p class="timeline_popup_header">CONTENT COULD NOT BE LOADED</p>' +
                                '<div class="timeline_popup_line"></div>' +
                                '<p class="timeline_popup_subheader">' +
                                    'If you opened index.html straight from your file system, ' +
                                    'the browser blocks loading extra files. Run the site through ' +
                                    'a local web server instead (VS Code "Live Server", or ' +
                                    'python -m http.server 8000).' +
                                '</p>' +
                            '</div>' +
                        '</div>' +
                    '</div>';
            });

        return el._popupPromise;
    }

    /* ---------- load them all up front, so clicking is instant ---------- */

    function preloadAll() {
        var boxes = document.querySelectorAll('[data-popup-src]');
        for (var i = 0; i < boxes.length; i++) {
            loadFragment(boxes[i]);
        }
    }

    /* ---------- make popup(n) wait for its file, if it has one ---------- */

    var attempts = 0;

    function hookPopup() {
        var original = window.popup;

        // java.js may not have run yet - try again for a couple of seconds
        if (typeof original !== 'function') {
            if (attempts++ < 40) setTimeout(hookPopup, 50);
            else console.warn('[popup_loader] popup() was never found - is java.js loaded?');
            return;
        }

        window.popup = function (id) {
            var el = document.getElementById('container_popup_' + id);
            var args = arguments;
            var self = this;

            if (el && el.hasAttribute('data-popup-src')) {
                loadFragment(el).then(function () {
                    original.apply(self, args);
                });
                return;
            }

            // popups still written directly in index.html: unchanged behaviour
            return original.apply(self, args);
        };
    }

    function start() {
        preloadAll();
        hookPopup();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
