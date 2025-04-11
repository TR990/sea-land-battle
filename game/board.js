const Card = require('./card');

class Board {
  constructor() {
    this.playerSlots = [
      {
        base: null,
        defenses: Array(4).fill(null), // ·ÀÏß²Û
        weapons: Array(2).fill(null), // Ô¶³ÌÎäÆ÷²Û
        landSlots: Array(4).fill(null), // Â½¾ü²Û
        seaSlots: Array(4).fill(null), // º£¾ü²Û
      },
      {
        base: null,
        defenses: Array(4).fill(null),
        weapons: Array(2).fill(null),
        landSlots: Array(4).fill(null),
        seaSlots: Array(4).fill(null),
      }
    ];
    this.frontline = {
      seaLeft: Array(2).fill(null),
      seaRight: Array(2).fill(null),
      land: Array(5).fill(null),
    };
    this.resourcePoints = {
      seaLeft: null,
      seaRight: null,
      land: null,
    };
  }

  canDeploy(playerId, card, slotType, slotIndex) {
    const slots = this.getSlots(playerId, slotType);
    if (!slots || slotIndex >= slots.length || slots[slotIndex]) return false;
    if (slotType === 'resource') return card.type === 'unit';
    if (slotType === 'defenses') return card.type === 'defense';
    if (slotType === 'weapons') return card.type === 'weapon';
    if (slotType === 'landSlots') return card.type === 'unit' && card.subType.includes('land');
    if (slotType === 'seaSlots') return card.type === 'unit' && card.subType.includes('sea');
    if (slotType === 'frontline') return card.type === 'unit';
    return false;
  }

  deploy(playerId, card, slotType, slotIndex) {
    const slots = this.getSlots(playerId, slotType);
    slots[slotIndex] = new Card(card);
  }

  canMove(playerId, fromType, fromIndex, toType, toIndex) {
    const fromSlots = this.getSlots(playerId, fromType);
    const toSlots = this.getSlots(playerId, toType);
    return fromSlots[fromIndex] && !toSlots[toIndex];
  }

  move(playerId, fromType, fromIndex, toType, toIndex) {
    const fromSlots = this.getSlots(playerId, fromType);
    const toSlots = this.getSlots(playerId, toType);
    toSlots[toIndex] = fromSlots[fromIndex];
    fromSlots[fromIndex] = null;
  }

  getUnit(playerId, slotType, slotIndex) {
    const slots = this.getSlots(playerId, slotType);
    return slots[slotIndex];
  }

  removeUnit(playerId, slotType, slotIndex) {
    const slots = this.getSlots(playerId, slotType);
    slots[slotIndex] = null;
  }

  getSlots(playerId, slotType) {
    if (slotType === 'resource') return [this.resourcePoints.seaLeft, this.resourcePoints.seaRight, this.resourcePoints.land];
    if (slotType === 'frontline') return this.frontline[slotType === 'seaLeft' ? 'seaLeft' : slotType === 'seaRight' ? 'seaRight' : 'land'];
    return this.playerSlots[playerId][slotType];
  }

  getState() {
    return {
      playerSlots: this.playerSlots,
      frontline: this.frontline,
      resourcePoints: this.resourcePoints
    };
  }
}

module.exports = Board;