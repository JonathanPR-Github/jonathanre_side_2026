/* ============================================================
   GAME NAMES ON THE LITTLE ICONS
   ------------------------------------------------------------
   Hovering a project button's game icon shows the name of the
   game it belongs to.

   The name is taken from the icon's own file name, so a new
   project needs nothing here as long as its icon is already in
   the list below. If you add a game, add one line:

        hoi4_icon.png   ->   hoi4: 'Hearts of Iron IV'

   The key is the file name with "_icon.png" removed.
   ============================================================ */

var GAME_NAMES = {
    tf2:       'Team Fortress 2',
    tf2c:      'Team Fortress 2 Classic',
    pf2:       'Pre-Fortress 2',
    l4d2:      'Left 4 Dead 2',
    bf2:       'Star Wars: Battlefront II',
    hoi4:      'Hearts of Iron IV',
    stalker:   'S.T.A.L.K.E.R.',
    stellaris: 'Stellaris',
    godot:     'Godot Engine',
    html:      'HTML',
    css:       'CSS',
    js:        'JavaScript'
};

(function () {
    'use strict';

    function nameIcons() {
        // the project buttons' game icons, and the HTML / CSS / JavaScript
        // icons in the about-me box
        var icons = document.querySelectorAll('.timeline_box_icon, .about_me_box_icon');

        for (var i = 0; i < icons.length; i++) {
            var icon = icons[i];
            if (icon.hasAttribute('data-game')) continue;

            var img = icon.querySelector('img');
            var source = img ? img.getAttribute('src') : icon.getAttribute('data-bg');
            if (!source) continue;

            // images/buttons/icons/tf2_icon.png  ->  tf2
            var file = source.split('/').pop().replace(/\.[a-z0-9]+$/i, '');
            var key = file.replace(/_icon$/i, '').toLowerCase();

            var name = GAME_NAMES[key];

            if (!name) {
                console.warn('[game_names] no name for "' + key + '" - add it to GAME_NAMES');
                continue;
            }

            icon.setAttribute('data-game', name);

            // the picture gets the name too, so it is not a mouse-only
            // feature and screen readers have something to read
            if (img && !img.getAttribute('alt')) img.setAttribute('alt', name);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', nameIcons);
    } else {
        nameIcons();
    }
})();
