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

   ...and a fresh iframe with the real src is inserted only when
   the popup is opened. Replacing the placeholder instead of using
   contentWindow.location.replace() is important: the YouTube
   Player API must be able to read the iframe's real src attribute
   before it can report play, pause and ended events.

   YouTube URLs also receive enablejsapi=1. This allows the music
   player to detect when a video starts or stops so the background
   music can fade out and back in.

   Public functions (used by popups/popup_loader.js):
        activateLazyFrames(root)  - let the videos load
        suspendLazyFrames(root)   - unload videos (stops playback)
   ============================================================ */

(function () {
    'use strict';

    function prepareFrameUrl(url) {
        if (!url) return url;

        try {
            var parsedUrl = new URL(url, window.location.href);
            var hostname = parsedUrl.hostname.toLowerCase();
            var isYouTube = hostname === 'www.youtube.com' ||
                hostname === 'youtube.com' ||
                hostname === 'www.youtube-nocookie.com' ||
                hostname === 'youtube-nocookie.com';

            if (isYouTube && parsedUrl.pathname.indexOf('/embed/') === 0) {
                parsedUrl.searchParams.set('enablejsapi', '1');
                parsedUrl.searchParams.set('playsinline', '1');

                // Supplying the page origin makes YouTube's postMessage
                // connection more reliable on Live Server and hosted sites.
                if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
                    parsedUrl.searchParams.set('origin', window.location.origin);
                }

                return parsedUrl.toString();
            }
        } catch (error) {
            console.warn('[lazy_media] Could not prepare iframe URL:', url, error);
        }

        return url;
    }

    function announceFrameEvent(name, frame) {
        document.dispatchEvent(new CustomEvent(name, {
            detail: {
                frame: frame
            }
        }));
    }

    function loadedFrameFrom(placeholder, url) {
        var loadedFrame = placeholder.cloneNode(false);

        loadedFrame.setAttribute('src', url);
        loadedFrame.setAttribute('data-loaded', 'true');

        return loadedFrame;
    }

    function placeholderFrameFrom(loadedFrame) {
        var placeholder = loadedFrame.cloneNode(false);

        placeholder.removeAttribute('src');
        placeholder.removeAttribute('data-loaded');
        placeholder.removeAttribute('id');

        return placeholder;
    }

    function activateLazyFrames(root) {
        var scope = root || document;
        var frames = scope.querySelectorAll('iframe[data-src]');

        for (var i = 0; i < frames.length; i++) {
            var frame = frames[i];
            if (frame.getAttribute('data-loaded') === 'true') continue;

            var url = prepareFrameUrl(frame.getAttribute('data-src'));
            var loadedFrame = loadedFrameFrom(frame, url);

            if (frame.parentNode) {
                frame.parentNode.replaceChild(loadedFrame, frame);
            } else {
                frame.setAttribute('src', url);
                frame.setAttribute('data-loaded', 'true');
                loadedFrame = frame;
            }

            announceFrameEvent('site-youtube-frame-activated', loadedFrame);
        }
    }

    function suspendLazyFrames(root) {
        var scope = root || document;
        var frames = scope.querySelectorAll('iframe[data-src][data-loaded="true"]');

        // Removing the active iframe stops playback immediately. A clean
        // data-src placeholder is inserted so the video can load again the
        // next time its popup is opened.
        for (var i = 0; i < frames.length; i++) {
            var frame = frames[i];

            announceFrameEvent('site-youtube-frame-suspended', frame);

            if (frame.parentNode) {
                frame.parentNode.replaceChild(placeholderFrameFrom(frame), frame);
            } else {
                frame.removeAttribute('src');
                frame.removeAttribute('data-loaded');
                frame.removeAttribute('id');
            }
        }
    }

    window.activateLazyFrames = activateLazyFrames;
    window.suspendLazyFrames = suspendLazyFrames;
}());
