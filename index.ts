import '@webcomponents/custom-elements/src/native-shim.js';
import './style.css';

const HANDLE_SIZE=20;
const ROTATE_HANDLE_Y_OFFSET=HANDLE_SIZE*2+HANDLE_SIZE/2;

function calculateCoords(width, height){
  const bottom = ROTATE_HANDLE_Y_OFFSET+height;
  const bottom_handle_y = bottom-HANDLE_SIZE/2-1;
  const top = ROTATE_HANDLE_Y_OFFSET;
  const top_handle_y = top - HANDLE_SIZE/2-1;
  const middle = top + height/2 - HANDLE_SIZE/2;
  const middle_handle_y = middle;
  return {
   "handle_size": HANDLE_SIZE,
   "box_height": height,
   "box_width": width,
   "height": height+60,
   "width": width+20,
   "box_top": ROTATE_HANDLE_Y_OFFSET,
   "box_left": HANDLE_SIZE/2,
   "top_offset": -50,
   "left_offset": -10,
   "rotate": [width/2+ HANDLE_SIZE/2, HANDLE_SIZE/2+1],
   "top_left": [1, top_handle_y], 
   "top_middle": [width/2, top_handle_y], 
   "top_right": [width-1, top_handle_y], 
   "middle_left": [1, middle_handle_y], 
   "middle_right": [width-1, middle_handle_y], 
   "bottom_left": [1, bottom_handle_y], 
   "bottom_middle": [width/2, bottom_handle_y], 
   "bottom_right": [width-1, bottom_handle_y],
   "center" : [(width+20)/2, ROTATE_HANDLE_Y_OFFSET+height/2]
  }
}
const positions = [
   "top_left",
   "top_middle" ,
   "top_right",
   "middle_left",
   "middle_right",
   "bottom_left",
   "bottom_middle", 
   "bottom_right",
];

const svg = document.getElementById("box-editor")

const handles = {}
positions.forEach((position)=>{
  handles[position]=svg.querySelector(`#handle_${position}`);
});
const box = svg.querySelector(`#box`);
const center = svg.querySelector(`#center`);
const rotate_handle = svg.querySelector(`#handle_rotate`);
handles['rotate'] = rotate_handle;
const rotate_line = svg.querySelector(`#handle_rotate_link`);

function updateCoordsHandle(handle, x, y){
  handle.setAttribute('x', x);
  handle.setAttribute('y', y);
}

function updateBox(coords){
  box.setAttribute('x', coords.box_left);
  box.setAttribute('y', coords.box_top);
  box.setAttribute('width', coords.box_width);
  box.setAttribute('height', coords.box_height);
}

function updateSVG(coords){
  svg.setAttribute('height', coords.height);
  svg.setAttribute('width', coords.width);
  svg.setAttribute('viewBox', `0 0 ${coords.width} ${coords.height}`);
}

function updateCoordsRotateHandle(coords){
  rotate_handle.setAttribute('cx', coords.rotate[0]);
  rotate_handle.setAttribute('cy', coords.rotate[1]);
  rotate_line.setAttribute('x1', coords.rotate[0]);
  rotate_line.setAttribute('x2', coords.rotate[0]);
}

function updateCoordsHandles(coords){
  positions.forEach((position)=>{
      updateCoordsHandle(handles[position], coords[position][0], coords[position][1])
  });
}

function updateCenter(coords){
  center.setAttribute('cx', coords.center[0]);
  center.setAttribute('cy', coords.center[1]);
}

const coords = calculateCoords(400, 200);

updateCoordsHandles(coords);
updateCoordsRotateHandle(coords);
updateCenter(coords);
updateBox(coords);
updateSVG(coords);

function setupHandles(){
//  // rotate
//  handles['rotate'].addEventListener('dragstart', (event)=>{
//    console.log(event)
//  })
//   handles['rotate'].addEventListener('click', (event)=>{
//    console.log(event)
//  })
}
setupHandles();

function makeDraggable() {

  var refs = {
    selectedElement: null,
    startAngularCoords: null,
    startCoords : null,
    startAngle : null,
    center : null,
    handle:null
  }

  document.addEventListener('mousedown', startDrag);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', endDrag);
  // svg.addEventListener('mouseleave', endDrag);

  function applyTransformations(evt){
    const destCoords = [evt.pageX, evt.pageY];
    const offsets = [refs.startCoords[0]- destCoords[0], refs.startCoords[1]-destCoords[1]];
        
    switch(refs.handle){
      case 'rotate':
        // coords from center 
        const destAngularCoords = getCoordsFromCenter(destCoords);
        const destAngle = getAngle(destAngularCoords);
        const angle = ((destAngle - refs.startAngle)* (180/Math.PI)).toFixed(2);
        svg.setAttribute('style', `transform-origin: ${coords.center[0]}px ${coords.center[1]}px; transform: rotate(${angle}deg);`)
        break;
      case 'top_left':

        break;
    }
  }

  function startDrag(evt) {
    if (evt.target.classList.contains('draggable')) {
      refs.selectedElement = evt.target;
      refs.handle = refs.selectedElement.getAttribute('id').replace(/handle_/, '');
      refs.startCoords = [evt.pageX, evt.pageY];
      switch(refs.handle){
        case 'rotate':
          refs.startAngularCoords = getCoordsFromCenter(refs.startCoords);
          refs.startAngle = getAngle(refs.startAngularCoords);
          break;
        case 'top_left':
          break;
      }

    }
  }

  function drag(evt) {
      if (refs.selectedElement) {
        evt.preventDefault();
        applyTransformations(evt);
      }
  }

  function endDrag(evt) {
    applyTransformations(evt);
        
    refs.selectedElement = null;
    // refs.startCoords = null;
    // refs.handle=null;
  }
}

function getCenter(){
  const x = window.scrollX + center.getBoundingClientRect().left; // X
  const y = window.scrollY + center.getBoundingClientRect().top; // Y
  return [x, y]
}

const coordCenter = getCenter();

function getCoordsFromCenter(coord){
  return [coord[0]-coordCenter[0], coord[1]-coordCenter[1]];
}

function getAngle(coords){
  return Math.atan2(coords[1], coords[0]);
}


makeDraggable();