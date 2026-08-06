/* ============================================================
   URL ROUTER
   ------------------------------------------------------------
   Gives every part of the site its own shareable link:

        yoursite.com/#menu          the intro tab   (container_tab_1)
        yoursite.com/#showcase      the timeline    (container_tab_2)
        yoursite.com/#popup_1       "THE FIRST TRIES"
        yoursite.com/#popup_2 ... #popup_16

   HOW IT OPENS THINGS
   It does not try to work out what OpenPopup() or ShowTab_2() do
   internally. It finds the button on the page that already does
   the job - the one whose onclick says popup(5) - and clicks it.
   Whatever a real visitor's click does, the link does too.
   Calling the functions directly is only a fallback for when no
   such button can be found.

   HOW IT KNOWS WHERE YOU ARE
   It looks at what is actually drawn on screen, not at which
   function was called. A popup counts as open when its own
   container_popup_N box is really being rendered, so a popup box
   that is merely set to display:flex inside a hidden shell does
   not fool it.

   WHY THE # ?
   A plain yoursite.com/menu needs the web server to answer that
   address with index.html. GitHub Pages will not - it looks for a
   real /menu folder, does not find one, and shows a 404. The #
   version needs no server setup and works everywhere. A real
   /menu path is still understood on arrival, in case you add
   rewrites later.

   DEBUGGING
   Type urlRouterReport() in the browser console to see what the
   router can find and what it thinks is on screen.
   ============================================================ */

(function () {
    'use strict';

    var DEFAULT_ROUTE = 'menu';
    var POPUP_ROUTE = /^popup_(\d+)$/;

    var applyingRoute = false;
    var writingRoute = false;
    var pendingRoute = null;
    var pendingSince = 0;

    /* ---------- is this element really on screen? ---------- */

    function rendered(el) {
        if (!el) return false;
        if (getComputedStyle(el).display === 'none') return false;

        // getClientRects is empty when any ancestor is hidden, and it
        // works for position:fixed, unlike offsetParent
        return el.getClientRects().length > 0;
    }

    function renderedId(id) {
        return rendered(document.getElementById(id));
    }

    function openPopupNumber() {
        var boxes = document.querySelectorAll('[id^="container_popup_"]');

        for (var i = 0; i < boxes.length; i++) {
            if (rendered(boxes[i])) {
                var match = /container_popup_(\d+)/.exec(boxes[i].id);
                if (match) return match[1];
            }
        }
        return null;
    }

    function readPage() {
        var open = openPopupNumber();
        if (open) return 'popup_' + open;

        if (renderedId('container_tab_2')) return 'showcase';
        if (renderedId('container_tab_1')) return 'menu';
        return '';
    }

    /* ---------- the address bar ---------- */

    function isKnown(route) {
        if (route === 'menu' || route === 'showcase') return true;

        var match = POPUP_ROUTE.exec(route);
        return !!(match && document.getElementById('container_popup_' + match[1]));
    }

    function readUrl() {
        var hash = (location.hash || '').replace(/^#/, '').toLowerCase();
        if (hash) return isKnown(hash) ? hash : '';

        var parts = location.pathname.split('/');
        var last = (parts[parts.length - 1] || '').toLowerCase();
        return isKnown(last) ? last : '';
    }

    function writeRoute(route) {
        if (!route || applyingRoute) return;
        if (location.hash === '#' + route) return;

        writingRoute = true;
        location.hash = route;
        setTimeout(function () { writingRoute = false; }, 100);
    }

    /* ---------- finding the buttons the visitor would click ---------- */

    function findByOnclick(pattern) {
        var nodes = document.querySelectorAll('[onclick]');

        for (var i = 0; i < nodes.length; i++) {
            if (pattern.test(nodes[i].getAttribute('onclick') || '')) return nodes[i];
        }
        return null;
    }

    function tabButton(which) {
        return findByOnclick(new RegExp('\\bShowTab_' + which + '\\s*\\('));
    }

    function popupButton(number) {
        return findByOnclick(new RegExp('\\bpopup\\(\\s*' + number + '\\s*\\)'));
    }

    function exitButton() {
        return document.querySelector('.timeline_popup_exit') ||
               findByOnclick(/\bClosePopup\s*\(/);
    }

    function press(el, fallbackName, fallbackArg) {
        if (el) { el.click(); return true; }

        if (typeof window[fallbackName] === 'function') {
            arguments.length > 2 ? window[fallbackName](fallbackArg) : window[fallbackName]();
            return true;
        }

        console.warn('[url_router] nothing found to run ' + fallbackName + '()');
        return false;
    }

    /* ---------- putting the page into a state ---------- */

    function applyRouteOnce(route) {
        applyingRoute = true;

        try {
            var match = POPUP_ROUTE.exec(route);

            if (match) {
                var number = match[1];

                // already showing the right one
                if (openPopupNumber() === number) return;

                if (!renderedId('container_tab_2')) press(tabButton(2), 'ShowTab_2');

                // one click on the timeline button does the whole job,
                // exactly as if the visitor had clicked it
                var button = popupButton(number);

                if (button) {
                    button.click();
                } else {
                    if (typeof window.OpenPopup === 'function') window.OpenPopup();
                    if (typeof window.popup === 'function') window.popup(number);
                    else console.warn('[url_router] no button and no popup() for popup_' + number);
                }
                return;
            }

            if (openPopupNumber()) press(exitButton(), 'ClosePopup');

            if (route === 'showcase') {
                if (!renderedId('container_tab_2')) press(tabButton(2), 'ShowTab_2');
            } else {
                if (!renderedId('container_tab_1')) press(tabButton(1), 'ShowTab_1');
            }
        } finally {
            applyingRoute = false;
        }
    }

    /* Opening a link is not a one-shot job: the popup's html is fetched by
       popups/popup_loader.js so it lands a moment later, and java.js may run
       its own setup on window load and undo what we just did. So we ask, then
       keep checking that the page really got there. */

    var RETRY_DELAYS = [80, 200, 400, 800, 1400, 2200, 3200, 4500];
    var retryTimers = [];

    function stopRetrying() {
        for (var i = 0; i < retryTimers.length; i++) clearTimeout(retryTimers[i]);
        retryTimers = [];
    }

    function applyRoute(route) {
        stopRetrying();

        pendingRoute = route;
        pendingSince = Date.now();

        applyRouteOnce(route);

        for (var i = 0; i < RETRY_DELAYS.length; i++) {
            retryTimers.push(setTimeout(function () {
                if (pendingRoute !== route) return;
                if (readPage() === route) { pendingRoute = null; stopRetrying(); return; }
                applyRouteOnce(route);
            }, RETRY_DELAYS[i]));
        }
    }

    function letUserTakeOver() {
        if (!retryTimers.length) return;
        pendingRoute = null;
        stopRetrying();
    }

    /* ---------- keeping the url in step with the page ---------- */

    function syncUrlToPage() {
        var route = readPage();
        if (!route) return;

        if (pendingRoute) {
            if (route === pendingRoute) pendingRoute = null;
            else if (Date.now() - pendingSince < 5000) return;
            else pendingRoute = null;
        }

        writeRoute(route);
    }

    var syncQueued = false;

    function queueSync() {
        if (syncQueued) return;
        syncQueued = true;
        setTimeout(function () { syncQueued = false; syncUrlToPage(); }, 60);
    }

    function watchPage() {
        if (window.MutationObserver) {
            var observer = new MutationObserver(queueSync);
            var options = { attributes: true, attributeFilter: ['style', 'class'] };

            var watched = ['container_tab_1', 'container_tab_2', 'container_tab_popup'];
            for (var i = 0; i < watched.length; i++) {
                var el = document.getElementById(watched[i]);
                if (el) observer.observe(el, options);
            }

            var boxes = document.querySelectorAll('[id^="container_popup_"]');
            for (var j = 0; j < boxes.length; j++) observer.observe(boxes[j], options);

            observer.observe(document.body, options);
        }

        // any click on the page might have changed what is showing
        document.addEventListener('click', queueSync, true);

        // last resort, in case something changes the page another way
        setInterval(syncUrlToPage, 700);
    }

    /* ---------- console helper ---------- */

    window.urlRouterReport = function () {
        var report = {
            url: location.href,
            hashRoute: readUrl(),
            onScreen: readPage(),
            openPopup: openPopupNumber(),
            tab1Rendered: renderedId('container_tab_1'),
            tab2Rendered: renderedId('container_tab_2'),
            popupShellRendered: renderedId('container_tab_popup'),
            bodyClasses: document.body.className,
            menuButtonFound: !!tabButton(1),
            showcaseButtonFound: !!tabButton(2),
            popup1ButtonFound: !!popupButton(1),
            exitButtonFound: !!exitButton(),
            functions: {
                ShowTab_1: typeof window.ShowTab_1,
                ShowTab_2: typeof window.ShowTab_2,
                OpenPopup: typeof window.OpenPopup,
                ClosePopup: typeof window.ClosePopup,
                popup: typeof window.popup
            }
        };
        console.log(report);
        return report;
    };

    /* ---------- start ---------- */

    function start() {
        var route = readUrl();

        if (route) {
            applyRoute(route);

            if (location.hash !== '#' + route) {
                try { history.replaceState(null, '', '#' + route); } catch (e) {}
            }

            // java.js may run its own setup on window load, after us
            window.addEventListener('load', function () {
                if (readUrl() === route && readPage() !== route) applyRoute(route);
            });
        } else {
            var shown = readPage() || DEFAULT_ROUTE;
            try { history.replaceState(null, '', '#' + shown); } catch (e) {}
        }

        watchPage();

        document.addEventListener('pointerdown', letUserTakeOver, true);
        document.addEventListener('keydown', letUserTakeOver, true);

        window.addEventListener('hashchange', function () {
            if (writingRoute) { writingRoute = false; return; }
            applyRoute(readUrl() || DEFAULT_ROUTE);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
