/* ============================================================
   LAZY VIDEO EMBEDS
   ------------------------------------------------------------
   Pictures are handled by the browser now: they are real <img>
   tags with loading="lazy", so no JavaScript is involved.

   YouTube embeds still need help. An <iframe> starts downloading
   Google's video player even when it sits inside a hidden popup,
   which is what made the front page slow. So the embeds are
   written with data-src instead of src:

        <iframe data-src="https://www.youtube.com/embed/..." loading="lazy"></iframe>

   ...and the real src is only filled in when the popup is opened.

   Public functions (used by popups/popup_loader.js):
        activateLazyFrames(root)  - let the videos load
        suspendLazyFrames(root)   - unload videos (stops playback)
   ============================================================ */

(function () {
    'use strict';

    function activateLazyFrames(root) {
        var scope = root || document;
        var frames = scope.querySelectorAll('iframe[data-src]');

        for (var i = 0; i < frames.length; i++) {
            var frame = frames[i];
            if (frame.getAttribute('data-loaded') === 'true') continue;

            var url = frame.getAttribute('data-src');

            // location.replace() instead of frame.src, because setting src
            // adds an entry to the browser history and that breaks the
            // back button (you would have to press it once per video)
            try { frame.contentWindow.location.replace(url); }
            catch (error) { frame.src = url; }

            frame.setAttribute('data-loaded', 'true');
        }
    }

    function suspendLazyFrames(root) {
        var scope = root || document;
        var frames = scope.querySelectorAll('iframe[data-src]');

        // sending the player back to a blank page stops playback,
        // data-src stays so it can come back if reopened
        for (var i = 0; i < frames.length; i++) {
            var frame = frames[i];
            if (frame.getAttribute('data-loaded') !== 'true') continue;

            try { frame.contentWindow.location.replace('about:blank'); }
            catch (error) { frame.removeAttribute('src'); }

            frame.removeAttribute('data-loaded');
        }
    }

    window.activateLazyFrames = activateLazyFrames;
    window.suspendLazyFrames = suspendLazyFrames;
})();
