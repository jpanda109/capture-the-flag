'use strict';

let io = require('socket.io-client');
let socket = io('http://localhost:8000');

let canvas = document.getElementById('canvas');
canvas.addEventListener('mousemove', handleMouseMove, false);
window.addEventListener('keydown', handleKeyDown, false);
let ctx = canvas.getContext('2d');

let joinedRoom = false;

// join appropriate room when key is pressed
function handleKeyDown(e) {
  let key = e.keyCode;
  let room = key - 49;
  if (room < 6 && room > -1) {
    socket.emit('room', room);
    joinedRoom = true;
  }
}

// stores where player wants to go
let destination = {
  x: 0,
  y: 0
};

// update destination according to mouse position
function handleMouseMove(mouse) {
  destination = screenToGameCoords(mouse.clientX, mouse.clientY);
}

// helper function to transform coords
function gameToScreenCoords(x, y) {
  return {
    x: 3*(x+200),
    y: 3*(-y+100)
  };
}

// helper function to transform coords
function screenToGameCoords(x, y) {
  return {
    x: x/3-200,
    y: -y/3+100
  };
}

// obvious
socket.on('connect', function() {
  console.log('connected');
});

// draw on canvas based on information from server
socket.on('gameState', function(data) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw middle line
  let start = gameToScreenCoords(0, -100);
  let end = gameToScreenCoords(0, 100);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.closePath();
  ctx.stroke();

  // draw players
  for (let i = 0; i < data.players.length; i++) {
    let p = data.players[i];
    let color = p.team === 0 ? '#FF0000' : '#00cc00';
    ctx.beginPath();
    let coords = gameToScreenCoords(p.x, p.y);
    ctx.arc(coords.x, coords.y, p.r*3, 0, 2*Math.PI);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fill();
  }

  // draw flags
  for (let i = 0; i < data.flags.length; i++) {
    let f = data.flags[i];
    let color = f.team === 0 ? '#FF0000' : '#00cc00';
    ctx.beginPath();
    let coords = gameToScreenCoords(f.x, f.y);
    ctx.arc(coords.x, coords.y, f.r*3, 0, 2*Math.PI);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fill();
    if (data.winner !== -1) {
      let msg = '';
      if (data.winner === 0) {
        msg = 'red team is winner';
      } else {
        msg = 'green team is winner';
      }
      let pos = gameToScreenCoords(-45, 0);
      ctx.font = '30px Arial';
      ctx.fillStyle = '#000000';
      ctx.fillText(msg, pos.x, pos.y);
    }
  }
});

// obvious
socket.on('disconnect', function() {
  console.log('disconnected');
});

// update by giving server relevant user input
function update() {
  if (joinedRoom) {
    socket.emit('destination', destination);
  } else {
    // display directions to join room
    ctx.font = '30px Arial';
    ctx.fillStyle = '#000000';
    let pos = gameToScreenCoords(-150, 0);
    ctx.fillText(
      'please press number on keyboard 1-6 to join that numbered room',
      pos.x,
      pos.y
    );
  }
  window.requestAnimationFrame(update);
}

window.requestAnimationFrame(update);
