var state = {
  pg: { path: [], timeout: 0} ,
  sg: { path: [], timeout: 0},
  sf: { path: [], timeout: 0},
  pf: { path: [], timeout: 0},
  c: { path: [], timeout: 0}
}
var isDragging = false;

var lastAngle = 0;

// var path = JSON.parse('[{"x":0,"y":-1.33331298828125},{"x":-1.33331298828125,"y":-11.333343505859375},{"x":-0.66668701171875,"y":-4},{"x":-0.666656494140625,"y":-6},{"x":-0.666656494140625,"y":-5.333343505859375},{"x":-0.66668701171875,"y":-4.666656494140625},{"x":-1.33331298828125,"y":-8.666656494140625},{"x":-0.66668701171875,"y":-3.333343505859375},{"x":-1.33331298828125,"y":-6},{"x":-0.66668701171875,"y":-2.666656494140625},{"x":-1.33331298828125,"y":-6},{"x":-1.333343505859375,"y":-4},{"x":-2,"y":-8},{"x":-0.666656494140625,"y":-2.66668701171875},{"x":-1.333343505859375,"y":-10},{"x":-1.333343505859375,"y":-4},{"x":-0.666656494140625,"y":-8.666656494140625},{"x":0,"y":-6.666656494140625},{"x":0,"y":-13.333343505859375},{"x":0,"y":-0.666656494140625},{"x":-1.333343505859375,"y":-18},{"x":-0.666656494140625,"y":-6},{"x":-2.666656494140625,"y":-14.000015258789062},{"x":-0.66668701171875,"y":-2.6666717529296875},{"x":0,"y":-8.666656494140625},{"x":0,"y":-8.666671752929688},{"x":0,"y":-4},{"x":0,"y":-3.3333282470703125},{"x":0,"y":-6.6666717529296875},{"x":0,"y":-6.6666717529296875},{"x":0,"y":-6},{"x":-0.666656494140625,"y":-10},{"x":0,"y":-9.333328247070312},{"x":0,"y":-6.6666717529296875},{"x":0,"y":-7.3333282470703125},{"x":0,"y":-2},{"x":0,"y":-8},{"x":0,"y":-5.3333282470703125},{"x":0.666656494140625,"y":-6.6666717529296875},{"x":0.66668701171875,"y":-2.6666717529296875},{"x":0.666656494140625,"y":-6},{"x":0.666656494140625,"y":-2.666656494140625},{"x":1.333343505859375,"y":-5.333343505859375},{"x":0,"y":-1.3333282470703125},{"x":2.666656494140625,"y":-10.666671752929688},{"x":0,"y":-2.6666641235351562},{"x":0.66668701171875,"y":-2},{"x":0.666656494140625,"y":-2},{"x":1.333343505859375,"y":0},{"x":2.666656494140625,"y":4},{"x":3.333343505859375,"y":6},{"x":6,"y":12.666664123535156},{"x":3.33331298828125,"y":7.333343505859375},{"x":6,"y":16},{"x":4.66668701171875,"y":13.333328247070312},{"x":4.666656494140625,"y":16.666671752929688},{"x":5.333343505859375,"y":14.666656494140625},{"x":5.33331298828125,"y":14.666671752929688},{"x":1.333343505859375,"y":4.6666717529296875},{"x":3.333343505859375,"y":16},{"x":2.666656494140625,"y":7.3333282470703125},{"x":2,"y":10.666671752929688},{"x":0.666656494140625,"y":2.666656494140625},{"x":3.333343505859375,"y":16.66668701171875},{"x":0.666656494140625,"y":4.666656494140625},{"x":0.66668701171875,"y":2.666656494140625},{"x":0,"y":5.333343505859375},{"x":0.666656494140625,"y":9.333343505859375},{"x":0,"y":2},{"x":0,"y":8},{"x":0,"y":0.666656494140625},{"x":-0.666656494140625,"y":12.666656494140625},{"x":0,"y":4.66668701171875},{"x":-2,"y":7.33331298828125},{"x":-2.66668701171875,"y":7.333343505859375},{"x":-2,"y":2.666656494140625},{"x":-2.666656494140625,"y":3.333343505859375},{"x":-2,"y":2},{"x":-5.333343505859375,"y":4},{"x":-4,"y":3.333343505859375},{"x":-8,"y":4},{"x":-6.666656494140625,"y":2.666656494140625},{"x":-7.333343505859375,"y":3.333343505859375},{"x":-8.666656494140625,"y":1.33331298828125},{"x":-6.666656494140625,"y":0.66668701171875},{"x":-7.333343505859375,"y":0},{"x":-5.333343505859375,"y":0},{"x":-12,"y":-1.333343505859375},{"x":-11.33331298828125,"y":-2},{"x":-18.66668701171875,"y":-5.333343505859375},{"x":-2.666656494140625,"y":-1.33331298828125},{"x":-22,"y":-14.66668701171875},{"x":-6,"y":-7.33331298828125},{"x":-5.333343505859375,"y":-8},{"x":-3.33331298828125,"y":-10.333343505859375},{"x":-6.66668701171875,"y":-23.666656494140625},{"x":-0.666656494140625,"y":-7.333343505859375},{"x":0,"y":-28},{"x":0,"y":-15.333343505859375},{"x":1.333343505859375,"y":-17.666656494140625},{"x":1.33331298828125,"y":-13},{"x":5.333343505859375,"y":-12.666671752929688},{"x":2.666656494140625,"y":-5.3333282470703125},{"x":4,"y":-6},{"x":8,"y":-13.333343505859375},{"x":12.66668701171875,"y":-11},{"x":4,"y":-3.3333282470703125},{"x":10,"y":-4},{"x":18.666656494140625,"y":-5},{"x":17.333343505859375,"y":-2.6666717529296875},{"x":12.666656494140625,"y":-0.666656494140625},{"x":2.666656494140625,"y":0},{"x":30.66668701171875,"y":5.3333282470703125},{"x":4.666656494140625,"y":1.3333282470703125},{"x":16.666656494140625,"y":10},{"x":7.333343505859375,"y":6.6666717529296875},{"x":23.333343505859375,"y":37.33332824707031},{"x":4.666656494140625,"y":15.333343505859375},{"x":4,"y":20.666656494140625},{"x":0.666656494140625,"y":7.333343505859375},{"x":0,"y":8.666656494140625},{"x":0,"y":6.66668701171875},{"x":-5.33331298828125,"y":14},{"x":-4,"y":10},{"x":-7.333343505859375,"y":12},{"x":-6.666656494140625,"y":8},{"x":-10.66668701171875,"y":14.666656494140625},{"x":-3.33331298828125,"y":4.666656494140625},{"x":-10,"y":13.333343505859375},{"x":-7.333343505859375,"y":6},{"x":-7.333343505859375,"y":6},{"x":-5.33331298828125,"y":3.333343505859375},{"x":-7.333343505859375,"y":2.666656494140625},{"x":-4.666656494140625,"y":0.666656494140625},{"x":-8.66668701171875,"y":3.333343505859375},{"x":-5.33331298828125,"y":0.666656494140625},{"x":-4,"y":1.333343505859375},{"x":-8,"y":1.333343505859375},{"x":-4,"y":0.666656494140625},{"x":-1.333343505859375,"y":0.666656494140625},{"x":-0.666656494140625,"y":0}]');

function move(elem, i) {
  setTimeout(function() {
    if (state[elem.id].path.length > 0) {
      var x = parseFloat((elem.getAttribute('data-x')) || 0) + state[elem.id].path[i].x;
      var y = parseFloat((elem.getAttribute('data-y')) || 0) + state[elem.id].path[i].y;
  
      elem.style.transform = elem.style.webkitTransform = `translate(${x}px, ${y}px)`;
  
      elem.setAttribute('data-x', x);
      elem.setAttribute('data-y', y);
  
      if (i + 1 < state[elem.id].path.length) {
        move(elem, i + 1);
      } else {
        state[elem.id].path = []
      }
    }

  }, state[elem.id].timeout)
}

function calc_length(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

function calc_net_change(p1, p2) {
  return (Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y)) / calc_length(p1, p2)
}

function get_mid(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  }
}

function calc_angle(p1, p2) {
  var width = Math.abs(p1.x - p2.x)
  var height = Math.abs(p1.y - p2.y)

  var angInRad = (Math.atan(height / width))
  var deg = angInRad * 180 / Math.PI
  console.log(`Rad: ${angInRad} Deg: ${deg}`)

  if (p2.x > p1.x && p2.y < p1.y) {
    // first quad
    return deg
  }

  if (p2.y < p1.y) {
    // second quad
    return 180 - deg
  }

  if (p2.x >= p1.x) {
    // fourth quad
    return 360 - deg
  }

  return 180 + deg
}

interact('.player').draggable({
  inertia: false,
  max: Infinity,
  autoscroll: true,
  // keep the element within the area of it's parent
  restrict: {
    restriction: 'parent',
    endOnly: true,
    elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
  },  
  onmove: dragMoveListener,
  onend: function(event) {
    console.log('Moved ' + event.target.id);
    console.log('Last angle : ' + lastAngle)
    state[event.target.id].timeout = 800 / state[event.target.id].path.length;
    // setTimeout(() => {
    //   init();
    //   move(event.target, 0);
    // }, 1000)
  }
});


function dragMoveListener(event) {

  handle(event)
  console.log('exit listener')

  // // old transitions
  // var old_dx = parseFloat(target.getAttribute('data-x'));
  // var old_dy = parseFloat(target.getAttribute('data-y'));

  // // old data points
  // var old_x = target.offsetLeft + 25 + old_dx
  // var old_y = target.offsetTop + 25 + old_dy

  // // // create path for old data point as div
  // // var div = document.createElement('div')
  // // div.style.position = 'absolute'
  // // div.style.width = '10px'
  // // div.style.height = '10px'
  // // div.style.backgroundColor = 'black'
  // // document.getElementById('court').appendChild(div)
  // // div.style.left = `${old_x + 25}px`
  // // div.style.top = `${old_y + 25}px`
  
  // // keep the dragged position in the data-x/data-y attributes
  // var new_dx = (old_dx || 0) + event.dx;
  // var new_dy = (old_dy || 0) + event.dy;

  // // new data points
  // var new_x = target.offsetLeft + 25 + new_dx;
  // var new_y = target.offsetTop + 25 + new_dy;

  // // draw div on midpoint
  // var width = Math.max(calc_length({x: old_x, y: old_y}, {x: new_x, y: new_y}), 9);
  // var change = calc_net_change({x: old_x, y: old_y}, {x: new_x, y: new_y});
  // var height = 6;
  // var mid = get_mid({x: old_x, y: old_y}, {x: new_x, y: new_y});
  // var top = mid.y - (height / 2)
  // var left = mid.x - (width / 2)

  // var degrees = calc_angle({x: old_x, y: old_y}, {x: new_x, y: new_y})

  // var div = document.createElement('div')
  // div.className = 'trace'
  // div.style.position = 'absolute'
  // div.style.top = `${top}px`
  // div.style.left = `${left}px`
  // div.style.width = `${width}px`
  // div.style.height = `${height}px`
  // div.style.backgroundColor = 'black'
  // div.style.borderRadius = `${height / 4}px`
  // div.style.webkitTransform = `rotate(-${degrees}deg)`; 
  // div.style.mozTransform    = `rotate(-${degrees}deg)`; 
  // div.style.msTransform     = `rotate(-${degrees}deg)`; 
  // div.style.oTransform      = `rotate(-${degrees}deg)`; 
  // div.style.transform       = `rotate(-${degrees}deg)`;
  // document.getElementById('court').appendChild(div);

  // // translate the element
  // target.style.webkitTransform =
  // target.style.transform =
  //   'translate(' + new_dx + 'px, ' + new_dy + 'px)';

  // // update the posiion attributes
  // target.setAttribute('data-x', new_dx);
  // target.setAttribute('data-y', new_dy);

  // // push path to state
  // state[target.id].path.push({
  //   x: event.dx, y: event.dy
  // })

  // target.parentNode.appendChild(target)

  // console.log(`Translating x: ${event.dx} y: ${event.dy}`)
}

async function handle(event) {
  target = event.target
  // old transitions
  var old_dx = parseFloat(target.getAttribute('data-x'));
  var old_dy = parseFloat(target.getAttribute('data-y'));

  // old data points
  var old_x = target.offsetLeft + 25 + old_dx
  var old_y = target.offsetTop + 25 + old_dy

  // // create path for old data point as div
  // var div = document.createElement('div')
  // div.style.position = 'absolute'
  // div.style.width = '10px'
  // div.style.height = '10px'
  // div.style.backgroundColor = 'black'
  // document.getElementById('court').appendChild(div)
  // div.style.left = `${old_x + 25}px`
  // div.style.top = `${old_y + 25}px`

  // keep the dragged position in the data-x/data-y attributes
  var new_dx = (old_dx || 0) + event.dx;
  var new_dy = (old_dy || 0) + event.dy;

  // new data points
  var new_x = target.offsetLeft + 25 + new_dx;
  var new_y = target.offsetTop + 25 + new_dy;

  // draw div on midpoint
  var width = Math.max(calc_length({x: old_x, y: old_y}, {x: new_x, y: new_y}), 9);
  var change = calc_net_change({x: old_x, y: old_y}, {x: new_x, y: new_y});
  var height = 6;
  var mid = get_mid({x: old_x, y: old_y}, {x: new_x, y: new_y});
  var top = mid.y - (height / 2)
  var left = mid.x - (width / 2)

  var degrees = calc_angle({x: old_x, y: old_y}, {x: new_x, y: new_y})

  var div = document.createElement('div')
  div.className = 'trace'
  div.style.position = 'absolute'
  div.style.top = `${top}px`
  div.style.left = `${left}px`
  div.style.width = `${width}px`
  div.style.height = `${height}px`
  div.style.backgroundColor = 'black'
  div.style.borderRadius = `${height / 4}px`
  div.style.webkitTransform = `rotate(-${degrees}deg)`; 
  div.style.mozTransform    = `rotate(-${degrees}deg)`; 
  div.style.msTransform     = `rotate(-${degrees}deg)`; 
  div.style.oTransform      = `rotate(-${degrees}deg)`; 
  div.style.transform       = `rotate(-${degrees}deg)`;
  document.getElementById('court').appendChild(div);

  if (!isNaN(degrees)) lastAngle = degrees;

  // translate the element
  target.style.webkitTransform =
  target.style.transform =
    'translate(' + new_dx + 'px, ' + new_dy + 'px)';

  // update the posiion attributes
  target.setAttribute('data-x', new_dx);
  target.setAttribute('data-y', new_dy);

  // push path to state
  state[target.id].path.push({
    x: event.dx, y: event.dy
  })

  target.parentNode.appendChild(target)

  console.log(`Translating x: ${event.dx} y: ${event.dy}`)
}

window.dragMoveListener = dragMoveListener;

var pg = document.getElementById('pg');
var sg = document.getElementById('sg');
var sf = document.getElementById('sf');
var pf = document.getElementById('pf');
var c = document.getElementById('c');

var starting = {
  'pg': {'top': '400px', 'left': '400px'},
  'sg': {'top': '300px', 'left': '100px'},
  'sf': {'top': '300px', 'left': '700px'},
  'pf': {'top': '200px', 'left': '300px'},
  'c' : {'top': '50px', 'left': '500px'}
}

function init() {
  pg.setAttribute('style', `top: ${starting.pg.top}; left: ${starting.pg.left};`);
  sg.setAttribute('style', `top: ${starting.sg.top}; left: ${starting.sg.left};`);
  sf.setAttribute('style', `top: ${starting.sf.top}; left: ${starting.sf.left};`);
  pf.setAttribute('style', `top: ${starting.pf.top}; left: ${starting.pf.left};`);
  c.setAttribute('style', `top: ${starting.c.top}; left: ${starting.c.left};`);

  pg.setAttribute('data-x', 0);
  pg.setAttribute('data-y', 0);
  sg.setAttribute('data-x', 0);
  sg.setAttribute('data-y', 0);
  sf.setAttribute('data-x', 0);
  sf.setAttribute('data-y', 0);
  pf.setAttribute('data-x', 0);
  pf.setAttribute('data-y', 0);
  c.setAttribute('data-x', 0);
  c.setAttribute('data-y', 0);
}
// emulate();
init();

document.getElementById('replay').addEventListener('click', function(event) {
  init();
  // hide all traces
  var traces = document.getElementsByClassName('trace')
  for (trace of traces) {
    trace.style.display = 'none'
  }
  for (var player in state) {
    console.log(player)
    move(document.getElementById(player), 0);
  }
});