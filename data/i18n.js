/*
 * SITE LOCALIZATION MANAGER
 * -------------------------
 * Loads the text files from data/localization/en and data/localization/no,
 * applies them to elements marked with data-i18n-file/data-i18n-key, and
 * switches language without reloading the page.
 *
 * English is always the default language when the site is opened.
 */
(function () {
    'use strict';

    var DEFAULT_LANGUAGE = 'en';
    var SUPPORTED_LANGUAGES = ['en', 'no'];
    var STARTUP_FILES = ['shared', 'intro', 'timeline'];
    var cache = Object.create(null);
    var currentLanguage = DEFAULT_LANGUAGE;
    var languageChangeNumber = 0;

    function cacheKey(language, fileName) {
        return language + ':' + fileName;
    }

    function localizationPath(language, fileName) {
        return 'data/localization/' + language + '/' + fileName + '.json';
    }

    function loadFile(fileName, language) {
        language = language || currentLanguage;
        var key = cacheKey(language, fileName);

        if (cache[key]) return cache[key];

        cache[key] = fetch(localizationPath(language, fileName))
            .then(function (response) {
                if (!response.ok) {
                    throw new Error(response.status + ' ' + response.statusText);
                }
                return response.json();
            })
            .catch(function (error) {
                delete cache[key];
                console.error('[i18n] Could not load ' + localizationPath(language, fileName) + ':', error);
                throw error;
            });

        return cache[key];
    }

    function valueFromFile(strings, key) {
        if (!strings || typeof key !== 'string') return undefined;

        // Localization keys are intentionally stored as flat, readable names.
        // A direct lookup also allows dots in keys such as "about.paragraph_01".
        return strings[key];
    }

    function elementsInside(root) {
        var selector = '[data-i18n-file][data-i18n-key]';
        var elements = [];

        if (root && root.nodeType === 1 && root.matches(selector)) {
            elements.push(root);
        }

        if (root && root.querySelectorAll) {
            var found = root.querySelectorAll(selector);
            for (var i = 0; i < found.length; i++) elements.push(found[i]);
        }

        return elements;
    }

    function attributeElementsInside(root) {
        var selector = '[data-i18n-file]';
        var elements = [];

        if (root && root.nodeType === 1 && root.matches(selector)) {
            elements.push(root);
        }

        if (root && root.querySelectorAll) {
            var found = root.querySelectorAll(selector);
            for (var i = 0; i < found.length; i++) elements.push(found[i]);
        }

        return elements;
    }

    function groupByFile(elements) {
        var groups = Object.create(null);

        for (var i = 0; i < elements.length; i++) {
            var fileName = elements[i].getAttribute('data-i18n-file');
            if (!fileName) continue;
            if (!groups[fileName]) groups[fileName] = [];
            groups[fileName].push(elements[i]);
        }

        return groups;
    }

    function applyTextElements(root, language, changeNumber) {
        var elements = elementsInside(root);
        var groups = groupByFile(elements);
        var jobs = [];

        Object.keys(groups).forEach(function (fileName) {
            jobs.push(
                loadFile(fileName, language).then(function (strings) {
                    if (changeNumber !== languageChangeNumber) return;

                    groups[fileName].forEach(function (element) {
                        var key = element.getAttribute('data-i18n-key');
                        var translated = valueFromFile(strings, key);

                        if (typeof translated !== 'string') {
                            console.warn('[i18n] Missing key "' + key + '" in ' + fileName + '.json (' + language + ')');
                            return;
                        }

                        if (element.hasAttribute('data-i18n-html')) {
                            // These strings come only from the site's own trusted JSON files.
                            element.innerHTML = translated;
                        } else {
                            element.textContent = translated;
                        }
                    });
                })
            );
        });

        return Promise.all(jobs);
    }

    function applyTranslatedAttributes(root, language, changeNumber) {
        var elements = attributeElementsInside(root);
        var groups = groupByFile(elements);
        var jobs = [];

        Object.keys(groups).forEach(function (fileName) {
            jobs.push(
                loadFile(fileName, language).then(function (strings) {
                    if (changeNumber !== languageChangeNumber) return;

                    groups[fileName].forEach(function (element) {
                        for (var i = 0; i < element.attributes.length; i++) {
                            var attribute = element.attributes[i];
                            var prefix = 'data-i18n-attr-';
                            if (attribute.name.indexOf(prefix) !== 0) continue;

                            var targetName = attribute.name.slice(prefix.length);
                            var translated = valueFromFile(strings, attribute.value);
                            if (typeof translated === 'string') {
                                element.setAttribute(targetName, translated);
                            }
                        }
                    });
                })
            );
        });

        return Promise.all(jobs);
    }

    function setCssTextVariable(name, value) {
        // CSS generated-content values need to include their quotation marks.
        document.documentElement.style.setProperty(name, JSON.stringify(value));
    }

    function updateSharedInterface(language, changeNumber) {
        return loadFile('shared', language).then(function (strings) {
            if (changeNumber !== languageChangeNumber) return;

            document.documentElement.lang = language;
            setCssTextVariable('--i18n-open-link', strings['overlays.open_link'] || 'Open to Link');
            setCssTextVariable('--i18n-open-image', strings['overlays.open_image'] || 'Open Image');

            var button = document.querySelector('.header_top_language_button');
            if (!button) return;

            // The ID controls which flag is shown in visual.css.
            // English active -> Norwegian flag is offered, and vice versa.
            button.id = language === 'en' ? 'language_en' : 'language_no';

            var targetKey = language === 'en'
                ? 'header.switch_to_norwegian'
                : 'header.switch_to_english';
            var targetLabel = strings[targetKey] || (language === 'en' ? 'Switch to Norwegian' : 'Switch to English');

            button.setAttribute('aria-label', targetLabel);
            button.setAttribute('title', targetLabel);
        });
    }

    function applyTo(root) {
        root = root || document;
        var language = currentLanguage;
        var changeNumber = languageChangeNumber;

        return Promise.all([
            applyTextElements(root, language, changeNumber),
            applyTranslatedAttributes(root, language, changeNumber),
            updateSharedInterface(language, changeNumber)
        ]);
    }

    function setLanguage(language) {
        if (SUPPORTED_LANGUAGES.indexOf(language) === -1) {
            console.warn('[i18n] Unsupported language:', language);
            return Promise.resolve();
        }

        currentLanguage = language;
        languageChangeNumber += 1;
        var changeNumber = languageChangeNumber;

        return Promise.all(STARTUP_FILES.map(function (fileName) {
            return loadFile(fileName, language);
        }))
            .then(function () {
                if (changeNumber !== languageChangeNumber) return;
                return applyTo(document);
            })
            .then(function () {
                if (changeNumber !== languageChangeNumber) return;
                document.dispatchEvent(new CustomEvent('site-language-changed', {
                    detail: { language: language }
                }));
            });
    }

    function toggleLanguage() {
        return setLanguage(currentLanguage === 'en' ? 'no' : 'en');
    }

    window.I18n = {
        applyTo: applyTo,
        getLanguage: function () { return currentLanguage; },
        loadFile: function (fileName) { return loadFile(fileName, currentLanguage); },
        setLanguage: setLanguage,
        toggleLanguage: toggleLanguage
    };

    function start() {
        // English is deliberately reset every time the page is opened.
        setLanguage(DEFAULT_LANGUAGE);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
