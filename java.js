function ShowTab_1() {
  document.getElementById('container_tab_1').style.display = 'block';
  document.getElementById('container_tab_2').style.display = 'none';
  document.body.style.height = '120vh'
}

function ShowTab_2() {
  document.getElementById('container_tab_1').style.display = 'none';
  document.getElementById('container_tab_2').style.display = 'block';
  document.body.style.height = '100vh'
}

function OpenPopup() {
  document.getElementById('container_tab_popup').style.display = 'block';
  document.body.classList.add('popup_active');
}
function ClosePopup() {   // NOTAT: Leg til alle videre popup specific meldinger in i her
  document.getElementById('container_tab_popup').style.display = 'none';
  document.body.classList.remove('popup_active');

  // Timeline popup hider. Increase the i <= per new box
  for (let i = 1; i <= 13; i++) {
    document.getElementById(`container_popup_${i}`).style.display = 'none';
  }

  // Stop & reset all YouTube videos inside the popup
  const youtubeIframes = document.querySelectorAll('#container_tab_popup iframe[src*="youtube.com"], #container_tab_popup iframe[src*="youtu.be"]');
  youtubeIframes.forEach(iframe => {
    const src = iframe.src;
    iframe.src = '';      // unload the player
    iframe.src = src;     // reload it in a paused/reset state
  });

}

function popup_1() {
document.getElementById('container_popup_1').style.display = 'flex';
}
function popup_2() {
  document.getElementById('container_popup_2').style.display = 'flex';
}
function popup_3() {
  document.getElementById('container_popup_3').style.display = 'flex';
}
function popup_4() {
  document.getElementById('container_popup_4').style.display = 'flex';
}
function popup_5() {
  document.getElementById('container_popup_5').style.display = 'flex';
}
function popup_6() {
  document.getElementById('container_popup_6').style.display = 'flex';
}
function popup_7() {
  document.getElementById('container_popup_7').style.display = 'flex';
}
function popup_8() {
  document.getElementById('container_popup_8').style.display = 'flex';
}
function popup_9() {
  document.getElementById('container_popup_9').style.display = 'flex';
}
function popup_10() {
  document.getElementById('container_popup_10').style.display = 'flex';
}
function popup_11() {
  document.getElementById('container_popup_11').style.display = 'flex';
}
function popup_12() {
  document.getElementById('container_popup_12').style.display = 'flex';
}
function popup_13() {
  document.getElementById('container_popup_13').style.display = 'flex';
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