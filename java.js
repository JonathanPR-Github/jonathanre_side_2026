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
}
function ClosePopup() {   // NOTAT: Leg til alle videre popup specific meldinger in i her
  document.getElementById('container_tab_popup').style.display = 'none';

  // Timeline functions for Popup
  document.getElementById('container_popup_1').style.display = 'none';
}

function popup_1() {
  document.getElementById('container_popup_1').style.display = 'flex';
}