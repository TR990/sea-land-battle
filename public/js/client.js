const socket = io();

socket.on('connect', () => {
  socket.emit('joinGame');
});

socket.on('playerId', (id) => {
  document.getElementById('status').innerText = `������� ${id + 1}`;
});

socket.on('gameStart', () => {
  document.getElementById('status').innerText += ' - ��Ϸ��ʼ';
});

socket.on('drawPhase', ({ gold }) => {
  const choice = confirm(`���: ${gold} - ��ѳ�1���ƻ򻨷�1��ҳ�2���ƣ�(ȷ��=��ѣ�ȡ��=����)`);
  socket.emit('drawCards', choice ? 'free' : 'pay');
});

socket.on('actionPhase', ({ hand, gold }) => {
  document.getElementById('hand').innerHTML = hand.map((card, i) => 
    `<button onclick="deploy(${i})">${card.name} (����: ${card.cost})</button>`
  ).join(' ');
  document.getElementById('endTurn').disabled = false;
});

socket.on('gameState', (state) => {
  console.log('��ǰ��Ϸ״̬:', state);
});

socket.on('gameEnd', ({ winner }) => {
  alert(`��Ϸ��������ʤ��: ${winner}`);
});

function deploy(cardIndex) {
  socket.emit('deploy', { cardIndex, slotType: 'landSlots', slotIndex: 0 }); // ʾ������
}

document.getElementById('endTurn').addEventListener('click', () => {
  socket.emit('endTurn');
  document.getElementById('endTurn').disabled = true;
});