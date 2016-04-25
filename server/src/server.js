'use strict';

let server  = require('http').createServer();
let io = require('socket.io')(server);

let Game = new require('./game.js');

// have 6 rooms to choose from
let rooms = [];
for (let i = 0; i < 6; i++) {
  rooms.push({
    game: new Game(),
    sockets: new Map()
  });
}

io.on('connection', function(socket) {
  let roomNumber = -1;
  console.log('new client');

  // join a room
  socket.on('room', function(n) {
    roomNumber = n;
    // find empty spot
    let room = rooms[n];
    let sockets = room.sockets;
    let used = new Set();
    sockets.forEach(function(i) {
      if (i < 6) {
        used.add(i);
      }
    });
    for (let i = 0; i < 7; i++) {
      if (!used.has(i)) {
        rooms[n].sockets.set(socket, i);
        break;
      }
    }
  });

  // handle user input from client
  socket.on('destination', function(destination) {
    if (roomNumber < 0) {
      return;
    }
    let room = rooms[roomNumber];
    let sockets = room.sockets;
    let game = room.game;
    let i = sockets.get(socket);
    game.players[i].destination = destination;
  });

  // remove this socket
  socket.on('disconnect', function() {
    if (roomNumber < 0) {
      return;
    }
    console.log('disconnect client');
    let sockets = rooms[roomNumber].sockets;
    sockets.delete(socket);
  });
});

// propagate game state to relevant clients.
function update() {

  // repeat for each room
  for (let i = 0; i < 6; i++) {
    let room = rooms[i];
    let game = room.game;
    let sockets = room.sockets;
    game.update(24/1000);
    let gameState = {
      'players': game.players.map(function (unit) {
        return {
          'team': unit.team,
          'x': unit.x,
          'y': unit.y,
          'r': unit.radius,
          'jailed': unit.jailed
        };
      }),
      'flags': game.flags.map(function(unit) {
        return {
          'team': unit.team,
          'x': unit.x,
          'y': unit.y,
          'r': unit.radius
        };
      }),
      'winner': game.winner
    };
    sockets.forEach(function(i, s) {
      s.emit('gameState', gameState);
    });
  }
}

// update interval
setInterval(update, 1000/24);

// hello world
console.log('listening on port 8000');
server.listen(8000, 'localhost');
