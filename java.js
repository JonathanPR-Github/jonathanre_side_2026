function ShowTab_1() {
  document.getElementById('container_tab_1').style.display = 'block';
  document.getElementById('container_tab_2').style.display = 'none';
  document.body.style.height = '120vh'
}

function ShowTab_2() {
  document.getElementById('container_tab_1').style.display = 'none';
  document.getElementById('container_tab_2').style.display = 'block';
  document.body.style.height = '100vh'

  if (condition) {
    
  }
}

function OpenPopup() {
  document.getElementById('container_tab_popup').style.display = 'block';
  document.body.classList.add('popup_active');
  ToggleVideoOnPopup();
}

function popup(num) {
  document.getElementById('container_popup_' + num).style.display = 'flex';
}

function ClosePopup() {   // NOTAT: Leg til alle videre popup specific meldinger in i her
  document.getElementById('container_tab_popup').style.display = 'none';
  document.body.classList.remove('popup_active');

  // Timeline popup hider.
  document.querySelectorAll('[id^="container_popup_"]').forEach(containers => {
    containers.style.display = 'none';
  });

  // Stop & reset all YouTube videos inside the popup
  const youtubeIframes = document.querySelectorAll('#container_tab_popup iframe[src*="youtube.com"], #container_tab_popup iframe[src*="youtu.be"]');
  youtubeIframes.forEach(iframe => {
    const src = iframe.src;
    iframe.src = '';      // unload the player
    iframe.src = src;     // reload it in a paused/reset state
  });

  // Stop & reset all <video> elements (webm, mp4, etc.) inside the popup
  const videoElements = document.querySelectorAll('#container_tab_popup video');
  videoElements.forEach(video => {
    video.pause();
    video.currentTime = 0;
  });

}

// STARTS VIDEOS
function ToggleVideoOnPopup() {
  const popup = document.getElementById('container_tab_popup');
  if (!popup) return;

  const videos = popup.querySelectorAll('video');

  if (popup.style.display === 'block') {
    videos.forEach(video => {
      video.currentTime = 0;
      video.play();
    });
  } else {
    videos.forEach(video => {
      video.pause();
      video.currentTime = 0;
    });
  }
}

/// Button Sounds
const clickSound = new Audio('sound/buttons/site_click.mp3');
const hoverSound = new Audio('sound/buttons/site_hover.mp3');
const holdSound = new Audio('sound/buttons/site_hold.mp3');
clickSound.volume = 0.3; 
hoverSound.volume = 0.3;
holdSound.volume = 0.3;

function OnClickSound() {
  clickSound.currentTime = 0;
  clickSound.play();
}

function OnHoverSound() {
  hoverSound.currentTime = 0;
  hoverSound.play();
}

function OnHoldSound() {
  hoverSound.currentTime = 0;
  hoverSound.play();
}

/// Keyboard press listeners
// Close popup with ESC key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    ClosePopup();
  }
});

/// TRANSLATER
