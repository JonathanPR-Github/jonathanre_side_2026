/* ============================================================
   DESKTOP MUSIC PLAYER
   ------------------------------------------------------------
   Starts disabled on every page load and never writes its state
   to localStorage. Each time it is switched on, the track list is
   shuffled once. Every track then plays exactly once in that order
   before the same shuffled order loops back to its first track.
   ============================================================ */
(function () {
    'use strict';

    var TRACKS = [
        {
            src: 'songs/music/kevin_macleod_airport_lounge.mp3',
            artist: 'Kevin MacLeod',
            title: 'Airport Lounge',
            album: 'Not in a Collection'
        },
        {
            src: 'songs/music/kevin_macleod_bossa_antigua.mp3',
            artist: 'Kevin MacLeod',
            title: 'Bossa Antigua',
            album: 'Teh Jazzes'
        },
        {
            src: 'songs/music/kevin_macleod_cold_funk.mp3',
            artist: 'Kevin MacLeod',
            title: 'Cold Funk',
            album: 'Funk and Blues'
        },
        {
            src: 'songs/music/kevin_macleod_night_in_venice.mp3',
            artist: 'Kevin MacLeod',
            title: 'Night in Venice',
            album: 'Royalty Free'
        },
        {
            src: 'songs/music/kevin_macleod_niles_blues.mp3',
            artist: 'Kevin MacLeod',
            title: 'Niles Blues',
            album: 'Funk and Blues'
        },
        {
            src: 'songs/music/kevin_macleod_return_of_the_mummy.mp3',
            artist: 'Kevin MacLeod',
            title: 'Return of the Mummy',
            album: 'Destruction Device'
        }
    ];

    var OFF_ICON = 'images/buttons/icons/music/music_off.svg';
    var ON_ICON = 'images/buttons/icons/music/music_on.svg';
    var PHONE_QUERY = '(max-width: 767px)';

    function shuffledTracks() {
        var tracks = TRACKS.slice();

        for (var i = tracks.length - 1; i > 0; i -= 1) {
            var randomIndex = Math.floor(Math.random() * (i + 1));
            var temporaryTrack = tracks[i];
            tracks[i] = tracks[randomIndex];
            tracks[randomIndex] = temporaryTrack;
        }

        return tracks;
    }

    function startMusicPlayer() {
        var player = document.getElementById('site_music_player');
        var button = document.getElementById('site_music_button');
        var buttonIcon = document.getElementById('site_music_button_icon');
        var audio = document.getElementById('site_music_audio');
        var artistText = document.getElementById('site_music_artist');
        var titleText = document.getElementById('site_music_title');
        var albumText = document.getElementById('site_music_album');
        var phoneMedia = window.matchMedia(PHONE_QUERY);

        if (!player || !button || !buttonIcon || !audio || !artistText || !titleText || !albumText) {
            return;
        }

        var enabled = false;
        var playlist = [];
        var trackIndex = 0;
        var consecutiveLoadErrors = 0;

        // Keep the music at a comfortable background level.
        audio.volume = 0.4;

        function translatedButtonLabel() {
            var fallback = enabled ? 'Turn site music off' : 'Turn site music on';
            var key = enabled ? 'music.turn_off' : 'music.turn_on';

            if (!window.I18n || typeof window.I18n.loadFile !== 'function') {
                button.setAttribute('aria-label', fallback);
                button.setAttribute('title', fallback);
                return;
            }

            window.I18n.loadFile('shared').then(function (strings) {
                var label = strings[key] || fallback;
                button.setAttribute('aria-label', label);
                button.setAttribute('title', label);
            }).catch(function () {
                button.setAttribute('aria-label', fallback);
                button.setAttribute('title', fallback);
            });
        }

        function updateTrackInformation(track) {
            artistText.textContent = track.artist;
            titleText.textContent = track.title;
            albumText.textContent = track.album;
        }

        function playCurrentTrack() {
            if (!enabled || !playlist.length) return;

            var track = playlist[trackIndex];
            updateTrackInformation(track);
            audio.src = track.src;
            audio.load();

            var playRequest = audio.play();
            if (playRequest && typeof playRequest.catch === 'function') {
                playRequest.catch(function (error) {
                    console.warn('[music] The track could not begin playing:', track.src, error);
                });
            }
        }

        function playNextTrack() {
            if (!enabled || !playlist.length) return;

            trackIndex = (trackIndex + 1) % playlist.length;
            consecutiveLoadErrors = 0;
            playCurrentTrack();
        }

        function enableMusic() {
            if (phoneMedia.matches || !TRACKS.length) return;

            enabled = true;
            playlist = shuffledTracks();
            trackIndex = 0;
            consecutiveLoadErrors = 0;

            player.classList.add('music_is_on');
            button.setAttribute('aria-pressed', 'true');
            buttonIcon.src = ON_ICON;
            translatedButtonLabel();
            playCurrentTrack();
        }

        function disableMusic() {
            enabled = false;
            playlist = [];
            trackIndex = 0;
            consecutiveLoadErrors = 0;

            audio.pause();
            audio.removeAttribute('src');
            audio.load();

            player.classList.remove('music_is_on');
            button.setAttribute('aria-pressed', 'false');
            buttonIcon.src = OFF_ICON;
            titleText.textContent = '';
            albumText.textContent = '';
            translatedButtonLabel();
        }

        button.addEventListener('click', function () {
            if (enabled) {
                disableMusic();
            } else {
                enableMusic();
            }
        });

        audio.addEventListener('ended', playNextTrack);

        audio.addEventListener('error', function () {
            if (!enabled || !playlist.length) return;

            consecutiveLoadErrors += 1;
            if (consecutiveLoadErrors >= playlist.length) {
                console.error('[music] None of the configured music files could be loaded.');
                disableMusic();
                return;
            }

            trackIndex = (trackIndex + 1) % playlist.length;
            playCurrentTrack();
        });

        function handlePhoneLayout(event) {
            if (event.matches && enabled) disableMusic();
        }

        if (typeof phoneMedia.addEventListener === 'function') {
            phoneMedia.addEventListener('change', handlePhoneLayout);
        } else if (typeof phoneMedia.addListener === 'function') {
            phoneMedia.addListener(handlePhoneLayout);
        }

        document.addEventListener('site-language-changed', translatedButtonLabel);

        // The player deliberately starts off on every new page load.
        disableMusic();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startMusicPlayer);
    } else {
        startMusicPlayer();
    }
}());
