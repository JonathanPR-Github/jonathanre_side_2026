/* ============================================================
   DESKTOP MUSIC PLAYER
   ------------------------------------------------------------
   Starts disabled on every page load and never writes its state
   to localStorage. Each time it is switched on, the track list is
   shuffled once. Every track then plays exactly once in that order
   before the same shuffled order loops back to its first track.

   When a YouTube video on the site starts playing, the background
   music fades to silence. It fades back to its normal volume when
   every YouTube video has been paused, stopped or finished.
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
    var BACKGROUND_VOLUME = 0.4;
    var MUSIC_FADE_DURATION = 700;
    var youtubeApiPromise = null;

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

    function loadYouTubeIframeApi() {
        if (window.YT && typeof window.YT.Player === 'function') {
            return Promise.resolve(window.YT);
        }

        if (youtubeApiPromise) return youtubeApiPromise;

        youtubeApiPromise = new Promise(function (resolve, reject) {
            var previousReadyHandler = window.onYouTubeIframeAPIReady;
            var finished = false;
            var checks = 0;

            function finish() {
                if (finished || !window.YT || typeof window.YT.Player !== 'function') return;

                finished = true;
                resolve(window.YT);
            }

            window.onYouTubeIframeAPIReady = function () {
                if (typeof previousReadyHandler === 'function') {
                    previousReadyHandler();
                }

                finish();
            };

            var existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');

            if (!existingScript) {
                var script = document.createElement('script');
                script.src = 'https://www.youtube.com/iframe_api';
                script.async = true;
                script.onerror = function () {
                    if (!finished) reject(new Error('The YouTube iframe API could not be loaded.'));
                };
                document.head.appendChild(script);
            }

            // Covers cases where another script replaces the global ready
            // callback or where the API becomes ready just before our handler.
            var readinessCheck = window.setInterval(function () {
                checks += 1;
                finish();

                if (finished || checks >= 200) {
                    window.clearInterval(readinessCheck);

                    if (!finished) {
                        reject(new Error('The YouTube iframe API did not become ready.'));
                    }
                }
            }, 50);
        });

        return youtubeApiPromise;
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
        var activeYouTubeFrames = [];
        var fadeAnimationFrame = null;
        var youtubeFrameId = 0;

        // Keep the music at a comfortable background level.
        audio.volume = BACKGROUND_VOLUME;

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

        function cancelVolumeFade() {
            if (fadeAnimationFrame !== null) {
                window.cancelAnimationFrame(fadeAnimationFrame);
                fadeAnimationFrame = null;
            }
        }

        function fadeMusicTo(targetVolume) {
            cancelVolumeFade();

            var startVolume = audio.volume;
            var volumeDifference = targetVolume - startVolume;

            if (Math.abs(volumeDifference) < 0.001) {
                audio.volume = targetVolume;
                return;
            }

            var startTime = null;

            function step(timestamp) {
                if (startTime === null) startTime = timestamp;

                var progress = Math.min((timestamp - startTime) / MUSIC_FADE_DURATION, 1);
                audio.volume = startVolume + (volumeDifference * progress);

                if (progress < 1) {
                    fadeAnimationFrame = window.requestAnimationFrame(step);
                } else {
                    audio.volume = targetVolume;
                    fadeAnimationFrame = null;
                }
            }

            fadeAnimationFrame = window.requestAnimationFrame(step);
        }

        function removeInactiveYouTubeFrames() {
            activeYouTubeFrames = activeYouTubeFrames.filter(function (frame) {
                return frame && frame.isConnected && frame.getAttribute('data-loaded') === 'true';
            });
        }

        function updateMusicForYouTubePlayback() {
            removeInactiveYouTubeFrames();

            if (!enabled) return;

            fadeMusicTo(activeYouTubeFrames.length > 0 ? 0 : BACKGROUND_VOLUME);
        }

        function setYouTubeFrameActive(frame, isActive) {
            var frameIndex = activeYouTubeFrames.indexOf(frame);

            if (isActive && frameIndex === -1) {
                activeYouTubeFrames.push(frame);
            } else if (!isActive && frameIndex !== -1) {
                activeYouTubeFrames.splice(frameIndex, 1);
            }

            updateMusicForYouTubePlayback();
        }

        function clearYouTubePlaybackState() {
            activeYouTubeFrames = [];
            updateMusicForYouTubePlayback();
        }

        function prepareYouTubeFrame(frame) {
            if (!frame || !frame.matches('iframe[data-src*="youtube.com/embed/"], iframe[data-src*="youtube-nocookie.com/embed/"]')) {
                return;
            }

            frame._siteMusicYouTubeGeneration = (frame._siteMusicYouTubeGeneration || 0) + 1;
            var generation = frame._siteMusicYouTubeGeneration;

            if (!frame.id) {
                youtubeFrameId += 1;
                frame.id = 'site_youtube_player_' + youtubeFrameId;
            }

            function attachPlayer(YT) {
                if (!frame.isConnected || frame._siteMusicYouTubeGeneration !== generation) return;
                if (frame.getAttribute('data-loaded') !== 'true') return;
                if (frame._siteMusicYouTubePlayer) return;

                try {
                    frame._siteMusicYouTubePlayer = new YT.Player(frame.id, {
                        events: {
                            onStateChange: function (event) {
                                if (frame._siteMusicYouTubeGeneration !== generation) return;

                                if (
                                    event.data === YT.PlayerState.PLAYING ||
                                    event.data === YT.PlayerState.BUFFERING
                                ) {
                                    setYouTubeFrameActive(frame, true);
                                    return;
                                }

                                if (
                                    event.data === YT.PlayerState.PAUSED ||
                                    event.data === YT.PlayerState.ENDED ||
                                    event.data === YT.PlayerState.CUED ||
                                    event.data === YT.PlayerState.UNSTARTED
                                ) {
                                    setYouTubeFrameActive(frame, false);
                                }
                            },
                            onError: function () {
                                if (frame._siteMusicYouTubeGeneration === generation) {
                                    setYouTubeFrameActive(frame, false);
                                }
                            }
                        }
                    });
                } catch (error) {
                    console.warn('[music] YouTube player monitoring could not be started:', error);
                }
            }

            loadYouTubeIframeApi().then(function (YT) {
                attachPlayer(YT);

                // If the iframe was still loading when the API became ready,
                // try again as soon as its YouTube document finishes loading.
                frame.addEventListener('load', function () {
                    attachPlayer(YT);
                }, { once: true });
            }).catch(function (error) {
                console.warn('[music] YouTube playback monitoring is unavailable:', error);
            });
        }

        function suspendYouTubeFrame(frame) {
            if (!frame) return;

            frame._siteMusicYouTubeGeneration = (frame._siteMusicYouTubeGeneration || 0) + 1;
            frame._siteMusicYouTubePlayer = null;
            setYouTubeFrameActive(frame, false);
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

            cancelVolumeFade();
            audio.volume = activeYouTubeFrames.length > 0 ? 0 : BACKGROUND_VOLUME;

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

            cancelVolumeFade();
            audio.pause();
            audio.removeAttribute('src');
            audio.load();
            audio.volume = BACKGROUND_VOLUME;

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

        document.addEventListener('site-youtube-frame-activated', function (event) {
            prepareYouTubeFrame(event.detail && event.detail.frame);
        });

        document.addEventListener('site-youtube-frame-suspended', function (event) {
            suspendYouTubeFrame(event.detail && event.detail.frame);
        });

        // ESC normally closes a popup through ClosePopup(), which unloads the
        // iframe and dispatches the suspended event above. This delayed check
        // is a fallback for any popup-closing path that hides the popup first.
        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape') return;

            window.setTimeout(function () {
                var popup = document.getElementById('container_tab_popup');
                if (!popup) return;

                var popupStyle = window.getComputedStyle(popup);
                var popupIsHidden = popupStyle.display === 'none' ||
                    popupStyle.visibility === 'hidden' ||
                    popup.getAttribute('aria-hidden') === 'true' ||
                    popup.getClientRects().length === 0;

                if (popupIsHidden) {
                    clearYouTubePlaybackState();
                }
            }, 50);
        }, true);

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
