'use strict';

const MAX_NAME = 30;
const MAX_MESSAGE = 1000;

const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/** Public shape of a member (never expose internal ids beyond what the client needs). */
const toMember = (u) => ({ id: u.id, username: u.username, room: u.room, status: u.status });

/**
 * Registers the chat events on a Socket.IO server.
 * `store` provides findUser, createUser, findBySocketId, getUsersInRoom and deleteUser.
 */
function registerChatHandlers(io, store, logger = console) {
  const roomInfo = async (room) => {
    const users = await store.getUsersInRoom(room);
    io.to(room).emit('roomInfo', { room, users: users.map(toMember) });
  };

  io.on('connection', (socket) => {
    // Acknowledgement callbacks are optional for clients; never crash without one.
    const ack = (cb) => (typeof cb === 'function' ? cb : () => {});

    socket.on('join', async (payload, callback) => {
      const reply = ack(callback);
      const username = clean(payload && payload.username, MAX_NAME);
      const room = clean(payload && payload.room, MAX_NAME);

      if (!username || !room) {
        return reply('Username and room are required.');
      }
      if (username.toLowerCase() === 'bot') {
        return reply('That username is reserved. Please pick another one.');
      }

      try {
        if (await store.findBySocketId(socket.id)) {
          return reply('You have already joined a room from this connection.');
        }
        const existing = await store.findUser(username, room);
        if (existing.length > 0) {
          return reply(`User ${username} already exists in room ${room}. Please select a different name or room.`);
        }

        const user = await store.createUser({ username, room, socketId: socket.id });
        if (!user) return reply('User could not be created. Try again later.');

        socket.join(room);
        socket.emit('welcome', {
          user: 'bot',
          text: `${username}, welcome to room ${room}.`,
          userData: toMember(user),
        });
        socket.broadcast.to(room).emit('message', { user: 'bot', text: `${username} has joined` });
        await roomInfo(room);
        return reply();
      } catch (err) {
        logger.error('join failed:', err.message);
        return reply('Something went wrong. Please try again.');
      }
    });

    socket.on('sendMessage', async (payload, callback) => {
      const reply = ack(callback);
      const text = clean(payload && payload.message, MAX_MESSAGE);
      if (!text) return reply('Message cannot be empty.');

      try {
        // Identify the sender by this connection, not by a client-supplied id,
        // so nobody can post as another member.
        const user = await store.findBySocketId(socket.id);
        if (!user) return reply('You are not in a room any more. Please rejoin the chat.');

        io.to(user.room).emit('message', { user: user.username, text });
        return reply();
      } catch (err) {
        logger.error('sendMessage failed:', err.message);
        return reply('Message could not be sent. Please try again.');
      }
    });

    socket.on('disconnect', async () => {
      try {
        const removed = await store.deleteUser(socket.id);
        const user = removed[0];
        if (user) {
          io.to(user.room).emit('message', { user: 'bot', text: `${user.username} has left the chat.` });
          await roomInfo(user.room);
        }
      } catch (err) {
        logger.error('disconnect cleanup failed:', err.message);
      }
    });
  });
}

module.exports = { registerChatHandlers, toMember };
