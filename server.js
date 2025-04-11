const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Game = require('./game/game');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public')); // 提供客户端静态文件

let game = null;

io.on('connection', (socket) => {
  console.log('玩家已连接');

  socket.on('joinGame', () => {
    if (!game || game.isFull()) {
      game = new Game(io); // 传入io以广播事件
    }
    game.addPlayer(socket);
  });

  socket.on('disconnect', () => {
    console.log('玩家已断开');
    if (game) {
      game.removePlayer(socket);
    }
  });
});

server.listen(3000, () => {
  console.log('服务器运行在3000端口');
});