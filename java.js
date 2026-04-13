function ShowTab_1() {
  document.getElementById('container_tab_1').style.display = 'block';
  document.getElementById('container_tab_2').style.display = 'none';
  document.body.style.height = '120vh'
}

function ShowTab_2() {
  document.getElementById('container_tab_1').style.display = 'none';
  document.getElementById('container_tab_2').style.display = 'block';
  document.body.style.height = '250vh'
}