class Player {
  constructor(socket) {
    this.socket = socket;
    this.gold = 0;
    this.hand = [];
    this.baseDefense = 20;
  }
}

module.exports = Player;