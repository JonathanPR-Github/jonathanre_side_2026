/* ============================================================
   SITE COLOR THEME MANAGER
   ------------------------------------------------------------
   Saves the visitor's selected theme in localStorage and applies
   it without reloading the page. When "random" is selected, one
   of the four real themes is chosen again on every page load.
   ============================================================ */

(function () {
    'use strict';

    var STORAGE_KEY = 'portfolioSiteTheme';
    var DEFAULT_CHOICE = 'default';
    var CHOICES = ['random', 'default', 'orange', 'green', 'purple'];
    var REAL_THEMES = ['default', 'orange', 'green', 'purple'];
    var ICON_BASE = 'images/buttons/icons/themes/theme_';

    function validChoice(choice) {
        return CHOICES.indexOf(choice) !== -1;
    }

    function readSavedChoice() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY);
            return validChoice(saved) ? saved : DEFAULT_CHOICE;
        } catch (error) {
            console.warn('[theme] Could not read the saved theme:', error);
            return DEFAULT_CHOICE;
        }
    }

    function saveChoice(choice) {
        try {
            localStorage.setItem(STORAGE_KEY, choice);
        } catch (error) {
            console.warn('[theme] Could not save the selected theme:', error);
        }
    }

    function randomTheme() {
        var randomNumber;

        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            var values = new Uint32Array(1);
            window.crypto.getRandomValues(values);
            randomNumber = values[0] / 4294967296;
        } else {
            randomNumber = Math.random();
        }

        return REAL_THEMES[Math.floor(randomNumber * REAL_THEMES.length)];
    }

    function resolveTheme(choice) {
        return choice === 'random' ? randomTheme() : choice;
    }

    var selectedChoice = readSavedChoice();
    var appliedTheme = resolveTheme(selectedChoice);

    function applyTheme(theme, choice) {
        appliedTheme = theme;
        selectedChoice = choice;

        document.documentElement.setAttribute('data-site-theme', theme);
        document.documentElement.setAttribute('data-theme-choice', choice);
    }

    // Apply the saved theme immediately while the document is still loading.
    applyTheme(appliedTheme, selectedChoice);

    function startThemeControls() {
        var selector = document.querySelector('.header_theme_selector');
        var toggle = document.getElementById('header_theme_button');
        var toggleIcon = document.getElementById('header_theme_button_icon');
        var menu = document.getElementById('header_theme_menu');
        var options = Array.prototype.slice.call(
            document.querySelectorAll('.header_theme_option[data-theme-choice]')
        );

        if (!selector || !toggle || !toggleIcon || !menu || !options.length) return;

        function updateControls() {
            toggleIcon.src = ICON_BASE + selectedChoice + '.svg';

            options.forEach(function (option) {
                var isSelected = option.getAttribute('data-theme-choice') === selectedChoice;
                option.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            });
        }

        function setMenuOpen(open) {
            selector.classList.toggle('theme_menu_open', Boolean(open));
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        }

        function closeMobileNavigation() {
            var header = document.querySelector('.header_top');
            var mobileToggle = document.querySelector('.header_mobile_menu_button');

            if (header) header.classList.remove('mobile_menu_open');
            if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
        }

        function selectChoice(choice) {
            if (!validChoice(choice)) return;

            var theme = resolveTheme(choice);
            applyTheme(theme, choice);
            saveChoice(choice);
            updateControls();
            setMenuOpen(false);

            document.dispatchEvent(new CustomEvent('site-theme-changed', {
                detail: {
                    choice: choice,
                    theme: theme
                }
            }));
        }

        toggle.addEventListener('click', function () {
            var shouldOpen = !selector.classList.contains('theme_menu_open');
            if (shouldOpen) closeMobileNavigation();
            setMenuOpen(shouldOpen);
        });

        menu.addEventListener('click', function (event) {
            var option = event.target.closest('.header_theme_option[data-theme-choice]');
            if (!option) return;

            selectChoice(option.getAttribute('data-theme-choice'));
            toggle.focus();
        });

        document.addEventListener('click', function (event) {
            if (!selector.contains(event.target)) {
                setMenuOpen(false);
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && selector.classList.contains('theme_menu_open')) {
                setMenuOpen(false);
                toggle.blur();
            }
        });

        updateControls();

        window.ThemeManager = {
            getAppliedTheme: function () { return appliedTheme; },
            getChoice: function () { return selectedChoice; },
            setChoice: selectChoice
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startThemeControls);
    } else {
        startThemeControls();
    }
}());
