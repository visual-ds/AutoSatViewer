/*var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
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
}*/

const leftPanel = document.getElementById('mapa-left');
const centerPanel = document.getElementById('map');
const rightPanel = document.getElementById('mapa-right');
const resizerLeft = document.getElementById('resizer-left');
const resizerRight = document.getElementById('resizer-right');

let isResizingLeft = false;
let isResizingRight = false;

resizerLeft.addEventListener('mousedown', function(e) {
    isResizingLeft = true;
    document.addEventListener('mousemove', handleResizeLeft);
    document.addEventListener('mouseup', stopResizeLeft);
});

resizerRight.addEventListener('mousedown', function(e) {
    isResizingRight = true;
    document.addEventListener('mousemove', handleResizeRight);
    document.addEventListener('mouseup', stopResizeRight);
});

function handleResizeLeft(e) {
    if (isResizingLeft) {
        const newWidth = e.clientX - leftPanel.getBoundingClientRect().left;
        leftPanel.style.width = newWidth + 'px';
    }
}

function handleResizeRight(e) {
    if (isResizingRight) {
        const newWidth = rightPanel.getBoundingClientRect().right - e.clientX;
        rightPanel.style.width = newWidth + 'px';
    }
}

function stopResizeLeft() {
    isResizingLeft = false;
    document.removeEventListener('mousemove', handleResizeLeft);
}

function stopResizeRight() {
    isResizingRight = false;
    document.removeEventListener('mousemove', handleResizeRight);
}