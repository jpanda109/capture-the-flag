'use strict';

// basic game unit from which others are derived
class GameUnit {

  /**
  * @param {number} x - x position
  * @param {number} y - y position
  * @param {number} team - team ID (0 or 1)
  **/
  constructor(x, y, radius, team) {
    this.radius = radius;
    this.x = x;
    this.y = y;
    this.team = team;
  }

  /**
  * @param {Circle} other - circle that you're checking collision with
  * @return {boolean} whether or not there's collision
  **/
  collides(other) {
    let distSq = Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2);
    return distSq <= Math.pow(this.radius + other.radius, 2);
  }
}

// look it's a player class
class Player extends GameUnit {
  constructor(x, y, team) {
    super(x, y, 10, team);
    this.destination = {
      x: x,
      y: y
    };
    this.jailed = false;
  }
}

// oh wow a flag
class Flag extends GameUnit {
  constructor(x, y, team) {
    super(x, y, 5, team);
    this.attached = -1;
  }
}

// stores game state
class Game {
  constructor() {
    this.flags = [
      new Flag(-100, 0, 0),
      new Flag(100, 0, 1)
    ];
    this.players = [
      new Player(-50, 30, 0),
      new Player(50, 30, 1),
      new Player(-50, 0, 0),
      new Player(50, 0, 1),
      new Player(-50, -30, 0),
      new Player(50, -30, 1)
    ];
    this.winner = -1;
    this.timeUntilReset = 3;
  }

  // if in own zone, return 1; if in enemy zone, return -1; if both, return 0
  getZone(player) {
    if ((player.team === 0 && player.x < -10)
        || (player.team === 1 && player.x > 10)) {
      return 1;
    } else if ((player.team === 0 && player.x > 10)
        || (player.team === 1 && player.x < -10)) {
      return -1;
    } else {
      return 0;
    }
  }

  update(deltaTime) {
    if (this.winner > -1) {

      // freeze game, reset after 3 seconds
      this.timeUntilReset -= deltaTime;
      if (this.timeUntilReset <= 0) {
        this.flags = [
          new Flag(-100, 0, 0),
          new Flag(100, 0, 1)
        ];
        this.players = [
          new Player(-50, 30, 0),
          new Player(50, 30, 1),
          new Player(-50, 0, 0),
          new Player(50, 0, 1),
          new Player(-50, -30, 0),
          new Player(50, -30, 1)
        ];
        this.winner = -1;
        this.timeUntilReset = 3;
      }
      return;
    }

    // update positions
    for (let i = 0; i < this.players.length; i++) {
      let player = this.players[i];
      if (player.jailed) {
        continue;
      }
      let dx = player.destination.x - player.x
          , dy = player.destination.y - player.y;
      if (dx === 0 && dy === 0) {
        continue;
      }
      let norm = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
      dx /= norm;
      dy /= norm;
      dx *= deltaTime * 100;
      dy *= deltaTime * 100;
      if (Math.abs(dx) > Math.abs(player.destination.x - player.x)) {
        dx = player.destination.x - player.x;
      }
      if (Math.abs(dy) > Math.abs(player.destination.y - player.y)) {
        dy = player.destination.y - player.y;
      }
      player.x += dx;
      player.y += dy;
    }

    // update flag collisions
    for (let i = 0; i < this.players.length; i++) {
      let player = this.players[i];
      let enemyFlag = this.flags[(player.team+1)%2];
      if (enemyFlag.attached < 0 && player.collides(enemyFlag)) {
        enemyFlag.attached = i;
      }
      let ownFlag = this.flags[player.team];
      if (player.collides(ownFlag)) {
        player.x = player.team === 0 ? -50 : 50;
        if (i === 0 || i === 1) {
          player.y = 30;
        } else if (i === 2 || i === 3) {
          player.y = 0;
        } else {
          player.y = -30;
        }
      }
    }

    // update player collisions
    for (let i = 0; i < this.players.length; i++) {
      let curPlayer = this.players[i];
      for (let j = 0; j < this.players.length; j++) {
        let otherPlayer = this.players[j];
        if (i === j || !curPlayer.collides(otherPlayer)) {
          continue;
        }
        if (curPlayer.team !== otherPlayer.team) {  // handle enemy collision
          if (this.getZone(curPlayer) === 1
              && this.getZone(otherPlayer) === -1) {
            otherPlayer.jailed = true;
            let flag = this.flags[curPlayer.team];
            if (flag.attached === j) {
              flag.attached = -1;
              flag.x = flag.team === 0 ? -100 : 100;
              flag.y = 0;
            }
          }
        } else if (curPlayer.team === otherPlayer.team) {  // handle teammate collision
          if (!curPlayer.jailed
              && this.getZone(curPlayer) === -1
              && this.getZone(otherPlayer) === -1) {
            otherPlayer.jailed = false;
          }
        }
      }
    }

    // update flag position (when attached to player)
    for (let i = 0; i < this.flags.length; i++) {
      let flag = this.flags[i];
      if (flag.attached >= 0) {
        flag.x = this.players[flag.attached].x;
        flag.y = this.players[flag.attached].y;
      }
    }

    // check win condition
    if (this.flags[0].x > 0) {
      this.winner = 1;
    } else if (this.flags[1].x < 0) {
      this.winner = 0;
    }

  }

}

// lib
module.exports = Game;
