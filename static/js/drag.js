var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
var divDraggable = document.getElementById("draggable"); // div principal
var dragBtn = document.getElementById("drag-btn"); // boton usado para mover 

dragBtn.onmousedown = function(e) {
  e.preventDefault();
  pos3 = e.clientX;
  pos4 = e.clientY;
  document.onmouseup = closeDragElement;
  document.onmousemove = elementDrag;
};

function elementDrag(e) {
  e.preventDefault();
  pos1 = pos3 - e.clientX;
  pos2 = pos4 - e.clientY;
  pos3 = e.clientX;
  pos4 = e.clientY;
  divDraggable.style.top = (divDraggable.offsetTop - pos2) + "px";
  divDraggable.style.left = (divDraggable.offsetLeft - pos1) + "px";
}

function closeDragElement() {
  document.onmouseup = null;
  document.onmousemove = null;
}