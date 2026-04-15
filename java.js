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

  // Timeline functions for Popup
  document.getElementById('container_popup_1').style.display = 'none';
}

function popup_1() {
  document.getElementById('container_popup_1').style.display = 'flex';
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