/* ============================================================
   ABOUT-ME TEXT FIT
   ------------------------------------------------------------
   Keeps the about-me text box the same height as the right
   column: shrinks the text just enough that it ends level with
   .about_me_site_info. If it will not fit even at MIN_FONT, the
   box scrolls instead (see .container_about_me_box_text in
   visual.css).
   ============================================================ */

(function () {
    var MAX_FONT = 22;   // never bigger than this
    var MIN_FONT = 15;   // never smaller than this - past this point the box scrolls instead

    function fitAboutMeText() {
        var wrap = document.querySelector('.container_about_me_box_text');
        var text = document.querySelector('.about_me_box_text');
        if (!wrap || !text) return;

        // stacked (phone/tablet) layout -> let the CSS font sizes do their job
        if (getComputedStyle(wrap).position !== 'absolute') {
            text.style.fontSize = '';
            return;
        }
        // tab hidden / not laid out yet
        if (wrap.clientHeight < 50) return;

        var padBottom = parseFloat(getComputedStyle(wrap).paddingBottom) || 0;

        function fits() {
            // the wrapper's own padding must stay free, so measure the content itself
            var room = wrap.getBoundingClientRect().bottom - padBottom + 1;
            return text.getBoundingClientRect().bottom <= room &&
                   wrap.scrollHeight <= wrap.clientHeight + 1;
        }

        var lo = MIN_FONT, hi = MAX_FONT, best = MIN_FONT;
        for (var i = 0; i < 12; i++) {
            var mid = (lo + hi) / 2;
            text.style.fontSize = mid + 'px';
            if (fits()) { best = mid; lo = mid; } else { hi = mid; }
        }
        text.style.fontSize = best.toFixed(2) + 'px';
    }

    var queued = false;
    function schedule() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () { queued = false; fitAboutMeText(); });
    }

    window.fitAboutMeText = schedule;
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', schedule);
    } else {
        schedule();
    }
    if (window.ResizeObserver) {
        var col = document.querySelector('.container_about_me_pl');
        if (col) new ResizeObserver(schedule).observe(col);
    }
})();
