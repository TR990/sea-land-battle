const socket = io();

socket.on('connect', () => {
  socket.emit('joinGame');
});

socket.on('playerId', (id) => {
  document.getElementById('status').innerText = `你是玩家 ${id + 1}`;
});

socket.on('gameStart', () => {
  document.getElementById('status').innerText += ' - 游戏开始';
});

socket.on('drawPhase', ({ gold }) => {
  const choice = confirm(`金币: ${gold} - 免费抽1张牌或花费1金币抽2张牌？(确定=免费，取消=付费)`);
  socket.emit('drawCards', choice ? 'free' : 'pay');
});

socket.on('actionPhase', ({ hand, gold }) => {
  document.getElementById('hand').innerHTML = hand.map((card, i) => 
    `<button onclick="deploy(${i})">${card.name} (费用: ${card.cost})</button>`
  ).join(' ');
  document.getElementById('endTurn').disabled = false;
});

socket.on('gameState', (state) => {
  console.log('当前游戏状态:', state);
});

socket.on('gameEnd', ({ winner }) => {
  alert(`游戏结束！获胜者: ${winner}`);
});

function deploy(cardIndex) {
  socket.emit('deploy', { cardIndex, slotType: 'landSlots', slotIndex: 0 }); // 示例部署
}

document.getElementById('endTurn').addEventListener('click', () => {
  socket.emit('endTurn');
  document.getElementById('endTurn').disabled = true;
});