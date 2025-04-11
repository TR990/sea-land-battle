const Player = require('./player');
const Board = require('./board');
const { shuffleDeck, drawCards } = require('./utils');

class Game {
  constructor(io) {
    this.io = io;
    this.players = [];
    this.currentTurn = 0;
    this.deck = shuffleDeck();
    this.board = new Board();
    this.resourcePoints = [
      { type: 'seaLeft', controlledBy: null, goldPerTurn: 0 },
      { type: 'seaRight', controlledBy: null, goldPerTurn: 0 },
      { type: 'land', controlledBy: null, goldPerTurn: 0 }
    ];
    this.totalTurns = 0; // 用于计算轮数
  }

  isFull() {
    return this.players.length >= 2;
  }

  addPlayer(socket) {
    if (this.players.length < 2) {
      const player = new Player(socket);
      this.players.push(player);
      socket.emit('playerId', this.players.length - 1);
      if (this.players.length === 2) {
        this.startGame();
      }
    } else {
      socket.emit('gameFull', { message: '游戏已满' });
    }
  }

  removePlayer(socket) {
    this.players = this.players.filter(p => p.socket !== socket);
    if (this.players.length < 2 && this.players.length > 0) {
      this.io.emit('gameEnd', { winner: this.players[0].socket.id });
    }
  }

  startGame() {
    this.players.forEach((player, index) => {
      player.gold = 2; // 初始资源
      player.hand = drawCards(this.deck, 5); // 初始手牌
      player.baseDefense = 20; // 基地防御值
    });
    // 随机资源点金币收益
    this.resourcePoints.forEach(rp => {
      rp.goldPerTurn = Math.floor(Math.random() * 3) + 1; // 1到3金币
    });
    this.io.emit('gameStart', { message: '游戏开始' });
    this.nextTurn();
  }

  nextTurn() {
    this.totalTurns++;
    const player = this.players[this.currentTurn];
    const turnNumber = Math.floor(this.totalTurns / 2) + 1;

    // 资源阶段
    player.gold += turnNumber + 1;
    this.resourcePoints.forEach(rp => {
      if (rp.controlledBy === this.currentTurn) {
        player.gold += rp.goldPerTurn;
      }
    });

    // 抽牌阶段
    player.socket.emit('drawPhase', { gold: player.gold });
    player.socket.once('drawCards', (option) => {
      if (option === 'free') {
        player.hand = player.hand.concat(drawCards(this.deck, 1));
      } else if (option === 'pay' && player.gold >= 1) {
        player.gold -= 1;
        player.hand = player.hand.concat(drawCards(this.deck, 2));
      }
      this.broadcastGameState();
      player.socket.emit('actionPhase', { hand: player.hand, gold: player.gold });
      this.listenToActions(player);
    });
  }

  listenToActions(player) {
    player.socket.on('deploy', (data) => this.handleDeploy(player, data));
    player.socket.on('move', (data) => this.handleMove(player, data));
    player.socket.on('attack', (data) => this.handleAttack(player, data));
    player.socket.on('useSkill', (data) => this.handleSkill(player, data));
    player.socket.on('endTurn', () => {
      this.currentTurn = (this.currentTurn + 1) % 2;
      this.nextTurn();
    });
  }

  handleDeploy(player, { cardIndex, slotType, slotIndex }) {
    const card = player.hand[cardIndex];
    if (!card || player.gold < card.cost) return;
    if (this.board.canDeploy(this.currentTurn, card, slotType, slotIndex)) {
      player.gold -= card.cost;
      this.board.deploy(this.currentTurn, card, slotType, slotIndex);
      player.hand.splice(cardIndex, 1);
      if (slotType === 'resource') {
        this.resourcePoints[slotIndex].controlledBy = this.currentTurn;
      }
      this.broadcastGameState();
    }
  }

  handleMove(player, { fromType, fromIndex, toType, toIndex }) {
    const unit = this.board.getUnit(this.currentTurn, fromType, fromIndex);
    if (!unit || unit.moved || unit.attacked) return;
    const cost = this.getMoveCost(unit);
    if (player.gold < cost) return;
    if (this.board.canMove(this.currentTurn, fromType, fromIndex, toType, toIndex)) {
      player.gold -= cost;
      this.board.move(this.currentTurn, fromType, fromIndex, toType, toIndex);
      unit.moved = true;
      this.broadcastGameState();
    }
  }

  handleAttack(player, { fromType, fromIndex, targetPlayer, targetType, targetIndex }) {
    const attacker = this.board.getUnit(this.currentTurn, fromType, fromIndex);
    if (!attacker || attacker.attacked || attacker.moved) return;
    let target;
    if (targetType === 'base') {
      target = { defense: this.players[targetPlayer].baseDefense };
    } else {
      target = this.board.getUnit(targetPlayer, targetType, targetIndex);
    }
    if (!target) return;

    this.resolveCombat(attacker, target, targetPlayer, targetType, targetIndex);
    attacker.attacked = true;
    this.broadcastGameState();
    this.checkGameEnd();
  }

  handleSkill(player, { cardIndex }) {
    const card = player.hand[cardIndex];
    if (!card || card.type !== 'skill' || player.gold < card.cost) return;
    // 技能效果需根据具体牌定义，这里仅示例移除
    player.gold -= card.cost;
    player.hand.splice(cardIndex, 1);
    this.broadcastGameState();
  }

  resolveCombat(attacker, target, targetPlayer, targetType, targetIndex) {
    let damage = attacker.attack;
    if (attacker.subType === 'warship' && target.subType === 'submarine') damage = 0;
    if (target.subType === 'lightArmor' && attacker.subType === 'infantry') damage = Math.max(0, damage - 1);
    if (target.subType === 'heavyArmor' && (attacker.subType === 'infantry' || attacker.subType === 'lightArmor')) {
      damage = Math.max(0, damage - 2);
    }

    if (targetType === 'base') {
      this.players[targetPlayer].baseDefense -= damage;
    } else {
      target.defense -= damage;
      attacker.defense -= target.attack || 0;
      if (target.defense <= 0) this.board.removeUnit(targetPlayer, targetType, targetIndex);
      if (attacker.defense <= 0) this.board.removeUnit(this.currentTurn, fromType, fromIndex);
    }
  }

  getMoveCost(unit) {
    switch (unit.subType) {
      case 'infantry': return 1;
      case 'lightArmor':
      case 'submarine': return 2;
      case 'heavyArmor':
      case 'warship': return 3;
      default: return 0;
    }
  }

  checkGameEnd() {
    this.players.forEach((p, index) => {
      if (p.baseDefense <= 0) {
        this.io.emit('gameEnd', { winner: this.players[(index + 1) % 2].socket.id });
      }
    });
  }

  broadcastGameState() {
    const state = {
      players: this.players.map(p => ({
        gold: p.gold,
        baseDefense: p.baseDefense,
        handCount: p.hand.length
      })),
      board: this.board.getState(),
      resourcePoints: this.resourcePoints,
      currentTurn: this.currentTurn
    };
    this.io.emit('gameState', state);
  }
}

module.exports = Game;