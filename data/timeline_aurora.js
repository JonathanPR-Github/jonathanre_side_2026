"use strict";

/*
   TIMELINE AURORA CLICK STATE
   Removes the attention glow from a timeline button after it has been
   clicked. The state is intentionally not saved, so refreshing/resetting
   the site restores every aurora.
*/
document.addEventListener("click", function (event) {
    if (!(event.target instanceof Element)) {
        return;
    }

    const timelineButton = event.target.closest(".timeline_box");

    if (!timelineButton) {
        return;
    }

    timelineButton.classList.add("timeline_box_seen");
});
