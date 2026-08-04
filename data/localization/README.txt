SITE LOCALIZATION FILES
=======================

The site uses one HTML file and changes its text in place.
English is loaded by default every time the page opens.
The flag button switches between English and Norwegian without reloading.

Folder structure
----------------
en/shared.json        Shared header, contact, overlay, and error text.
en/intro.json         Text used only by the Intro tab.
en/timeline.json      Text used only by the Timeline tab.
en/popups/popup_N.json
                      Text used only by that numbered popup.

The no folder has the exact same structure for Norwegian.

Editing text
------------
1. Open the matching English or Norwegian JSON file.
2. Change only the text to the right of a key.
3. Keep the key itself unchanged in both languages.
4. Keep commas and quotation marks valid JSON.
5. Text containing <br> or another HTML tag is intentionally applied as HTML.

The _comment entry at the beginning of every JSON file documents what that
individual file is for. The localization manager ignores _comment entries.

Code files
----------
data/i18n.js manages loading, applying, and switching languages.
popups/popup_loader.js applies the active language after loading a popup.
