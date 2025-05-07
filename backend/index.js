const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const usersInRoom = {};

io.on('connection', socket => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('join', roomId => {
    socket.join(roomId);
    usersInRoom[roomId] = usersInRoom[roomId] || [];
    usersInRoom[roomId].push(socket.id);
    console.log(`📥 ${socket.id} joined room ${roomId}`);
  });

  socket.on('start-call', ({ roomId }) => {
    socket.to(roomId).emit('incoming-call', { from: socket.id });
  });

  socket.on('accept-call', ({ roomId }) => {
    socket.to(roomId).emit('call-accepted', { by: socket.id });
  });

  socket.on('offer', ({ offer, roomId }) => {
    socket.to(roomId).emit('offer', { offer });
  });

  socket.on('answer', ({ answer, roomId }) => {
    socket.to(roomId).emit('answer', { answer });
  });

  socket.on('ice-candidate', ({ candidate, roomId }) => {
    socket.to(roomId).emit('ice-candidate', { candidate });
  });

  socket.on('end-call', ({ roomId }) => {
    io.to(roomId).emit('call-ended');
  });

  socket.on('disconnect', () => {
    console.log(`❌ Disconnected: ${socket.id}`);
  });
});

server.listen(3001, () => {
  console.log('🚀 Server listening on port 3001');
});
