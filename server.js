const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Game = require('./game/game');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // �ṩ�ͻ��˾�̬�ļ�

let game = null;

io.on('connection', (socket) => {
  console.log('���������');

  socket.on('joinGame', () => {
    if (!game || game.isFull()) {
      game = new Game(io); // ����io�Թ㲥�¼�
    }
    game.addPlayer(socket);
  });

  socket.on('disconnect', () => {
    console.log('����ѶϿ�');
    if (game) {
      game.removePlayer(socket);
    }
  });
});

server.listen(3000, () => {
  console.log('������������3000�˿�');
});