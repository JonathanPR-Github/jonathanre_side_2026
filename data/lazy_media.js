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
            if (!frames[i].getAttribute('src')) {
                frames[i].src = frames[i].getAttribute('data-src');
            }
        }
    }

    function suspendLazyFrames(root) {
        var scope = root || document;
        var frames = scope.querySelectorAll('iframe[data-src]');

        // dropping the src stops playback and frees the player,
        // data-src stays so it can come back if reopened
        for (var i = 0; i < frames.length; i++) {
            if (frames[i].getAttribute('src')) frames[i].removeAttribute('src');
        }
    }

    window.activateLazyFrames = activateLazyFrames;
    window.suspendLazyFrames = suspendLazyFrames;
})();
