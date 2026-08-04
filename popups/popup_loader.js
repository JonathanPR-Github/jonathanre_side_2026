/* ============================================================
   POPUP LOADER
   ------------------------------------------------------------
   Lets popup content live in separate files instead of index.html.

   In index.html the wrapper stays, but it is empty and points at
   a file:

        <div class="timeline_popup_content"
             id="container_popup_1"
             data-popup-src="popups/popup_1.html"></div>

   The markup that used to be inside it lives in popups/popup_1.html.

   Nothing else changes: the buttons still call popup(1), and the CSS
   still works because the class and id stay on the wrapper. Popups
   without a data-popup-src attribute are left completely alone.

   Loading is ON DEMAND - a popup's file is only fetched the first
   time it is opened (or when you hover its button, which gives the
   fetch a head start). That way the page does not download 16
   popups' worth of images and YouTube players just to show the
   front page.

   NOTE: this uses fetch(), which browsers block on file:// URLs.
   The site must be opened through a web server (GitHub Pages,
   VS Code "Live Server", or: python -m http.server 8000).
   ============================================================ */

(function () {
    'use strict';

    /* ---------- STILL IMAGE OPENERS ----------
       Makes the small popup screenshots act as previews.
       Clicking one opens its larger image in a new browser tab.

       To assign a different full-size image to one preview, add:

           data-full-image="images/large/example.jpg"

       to its .timeline_popup_box_img or
       .timeline_popup_subheader_box container.
       ------------------------------------------------------------ */

    var defaultFullImage = 'images/large/first_tries_big_1.jpg';

    function directImageInside(container) {
        for (var i = 0; i < container.children.length; i++) {
            if (container.children[i].tagName === 'IMG') {
                return container.children[i];
            }
        }

        return null;
    }

    function openFullImage(container) {
        var fullImage = container.getAttribute('data-full-image') || defaultFullImage;
        var newTab = window.open(fullImage, '_blank', 'noopener,noreferrer');

        if (newTab) {
            newTab.opener = null;
        }
    }

    function prepareStillImageOpeners(root) {
        if (!root || !root.querySelectorAll) return;

        var boxes = root.querySelectorAll(
            '.timeline_popup_box_img, .timeline_popup_subheader_box'
        );

        for (var i = 0; i < boxes.length; i++) {
            (function (box) {
                // Videos, iframes and images that are already external links
                // keep their existing behaviour.
                if (box.closest('a')) return;

                var image = directImageInside(box);
                if (!image || box.classList.contains('timeline_popup_image_opener')) return;

                var customFullImage =
                    box.getAttribute('data-full-image') ||
                    image.getAttribute('data-full-image');

                if (customFullImage) {
                    box.setAttribute('data-full-image', customFullImage);
                }

                box.classList.add('timeline_popup_image_opener');
                box.setAttribute('role', 'link');
                box.setAttribute('tabindex', '0');
                box.setAttribute('aria-label', 'Open image in a new tab');

                box.addEventListener('click', function () {
                    openFullImage(box);
                });

                box.addEventListener('keydown', function (event) {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openFullImage(box);
                    }
                });
            })(boxes[i]);
        }
    }

    /* ---------- load one fragment ---------- */

    function loadFragment(el) {
        if (!el) return Promise.resolve();
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
                prepareStillImageOpeners(el);

                // LOCALIZATION: popup text lives in its own popup_N.json file.
                // Apply the currently selected language as soon as the fragment is inserted.
                if (window.I18n && typeof window.I18n.applyTo === 'function') {
                    window.I18n.applyTo(el);
                }

                // the images inside carry loading="lazy", so the browser
                // handles them; the videos wait until the popup opens
            })
            .catch(function (error) {
                console.error('[popup_loader] could not load "' + src + '":', error);
                el.innerHTML =
                    '<div class="timeline_popup_textbox">' +
                        '<div class="timeline_popup_textbox_inner">' +
                            '<div class="timeline_popup_text_content">' +
                                '<p class="timeline_popup_header" data-i18n-file="shared" data-i18n-key="popup_error.heading">CONTENT COULD NOT BE LOADED</p>' +
                                '<div class="timeline_popup_line"></div>' +
                                '<p class="timeline_popup_subheader" data-i18n-file="shared" data-i18n-key="popup_error.body">' +
                                    'If you opened index.html straight from your file system, ' +
                                    'the browser blocks loading extra files. Run the site through ' +
                                    'a local web server instead (VS Code "Live Server", or ' +
                                    'python -m http.server 8000).' +
                                '</p>' +
                            '</div>' +
                        '</div>' +
                    '</div>';

                // LOCALIZATION: translate the error message as well.
                if (window.I18n && typeof window.I18n.applyTo === 'function') {
                    window.I18n.applyTo(el);
                }
            });

        return el._popupPromise;
    }

    function fragmentFor(id) {
        return document.getElementById('container_popup_' + id);
    }

    /* ---------- head start: fetch on hover / focus ---------- */

    function warmUpOnHover() {
        var buttons = document.querySelectorAll('[onclick*="popup("]');

        for (var i = 0; i < buttons.length; i++) {
            (function (button) {
                var match = /\bpopup\(\s*(\d+)\s*\)/.exec(button.getAttribute('onclick') || '');
                if (!match) return;

                var warm = function () { loadFragment(fragmentFor(match[1])); };
                button.addEventListener('mouseenter', warm, { once: true });
                button.addEventListener('focus', warm, { once: true });
                button.addEventListener('touchstart', warm, { once: true, passive: true });
            })(buttons[i]);
        }
    }

    /* ---------- make popup(n) wait for its file, if it has one ---------- */

    var attempts = 0;

    function hookPopup() {
        var originalPopup = window.popup;

        // java.js may not have run yet - try again for a couple of seconds
        if (typeof originalPopup !== 'function') {
            if (attempts++ < 40) setTimeout(hookPopup, 50);
            else console.warn('[popup_loader] popup() was never found - is java.js loaded?');
            return;
        }

        window.popup = function (id) {
            var el = fragmentFor(id);
            var args = arguments;
            var self = this;

            function show() {
                originalPopup.apply(self, args);
                // now that it is on screen, let its videos load
                if (window.activateLazyFrames && el) window.activateLazyFrames(el);
            }

            if (el && el.hasAttribute('data-popup-src')) {
                loadFragment(el).then(show);
                return;
            }

            show();   // popups still written directly in index.html
        };

        // closing a popup unloads its videos, so nothing keeps
        // playing or downloading behind the scenes
        var originalClose = window.ClosePopup;

        if (typeof originalClose === 'function') {
            window.ClosePopup = function () {
                var result = originalClose.apply(this, arguments);
                if (window.suspendLazyFrames) window.suspendLazyFrames(document);
                return result;
            };
        }
    }

    function start() {
        prepareStillImageOpeners(document);
        warmUpOnHover();
        hookPopup();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
