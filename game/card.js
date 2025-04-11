class Card {
  constructor(data) {
    this.cost = data.cost;
    this.type = data.type; // 'unit', 'defense', 'skill', 'weapon'
    this.subType = data.subType; // 'infantry', 'warship', etc.
    this.attack = data.attack || 0;
    this.defense = data.defense || 0;
    this.special = data.special || null;
    this.moved = false; // ׷���Ƿ��ƶ�
    this.attacked = false; // ׷���Ƿ񹥻�
  }

  resetTurn() {
    this.moved = false;
    this.attacked = false;
  }
}

module.exports = Card;