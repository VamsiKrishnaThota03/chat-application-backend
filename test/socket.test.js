'use strict';

// Integration test for the chat events with an in-memory store (no MongoDB).
// Run with: npm test
const assert = require('assert');
const http = require('http');
const { Server } = require('socket.io');
const { io: connect } = require('socket.io-client');
const { registerChatHandlers } = require('../config/functions/socket');

function memoryStore() {
  let seq = 0;
  let users = [];
  return {
    async findUser(username, room) { return users.filter((u) => u.username === username && u.room === room); },
    async createUser(data) { const u = { id: String(++seq), status: 'ONLINE', ...data }; users.push(u); return u; },
    async findBySocketId(socketId) { return users.find((u) => u.socketId === socketId) || null; },
    async getUsersInRoom(room) { return users.filter((u) => u.room === room); },
    async deleteUser(socketId) { const gone = users.filter((u) => u.socketId === socketId); users = users.filter((u) => u.socketId !== socketId); return gone; },
  };
}

const once = (socket, event) => new Promise((resolve) => socket.once(event, resolve));
const emitAck = (socket, event, payload) => new Promise((resolve) => socket.emit(event, payload, resolve));

async function main() {
  const server = http.createServer();
  const io = new Server(server);
  registerChatHandlers(io, memoryStore(), { error() {} });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}`;

  const alice = connect(url, { transports: ['websocket'] });
  const bob = connect(url, { transports: ['websocket'] });
  await Promise.all([once(alice, 'connect'), once(bob, 'connect')]);

  // Validation
  assert.strictEqual(await emitAck(alice, 'join', { username: '', room: '1' }), 'Username and room are required.');

  // Join + welcome
  const welcome = once(alice, 'welcome');
  assert.strictEqual(await emitAck(alice, 'join', { username: 'alice', room: 'general' }), undefined);
  assert.match((await welcome).text, /welcome to room general/);

  // Duplicate name in the same room is rejected exactly once (no second callback)
  const dup = await emitAck(bob, 'join', { username: 'alice', room: 'general' });
  assert.match(dup, /already exists/);

  // Bob joins; both see two members
  const info = once(alice, 'roomInfo');
  assert.strictEqual(await emitAck(bob, 'join', { username: 'bob', room: 'general' }), undefined);
  const { users } = await info;
  assert.deepStrictEqual(users.map((u) => u.username).sort(), ['alice', 'bob']);
  assert.ok(users.every((u) => !('socketId' in u)), 'socket ids must not be broadcast');

  // Messages are attributed by connection, not by a client-supplied userId
  const got = once(alice, 'message');
  assert.strictEqual(await emitAck(bob, 'sendMessage', { message: 'hi there', userId: '1' }), undefined);
  assert.deepStrictEqual(await got, { user: 'bob', text: 'hi there' });

  // Empty and unauthenticated messages
  assert.strictEqual(await emitAck(bob, 'sendMessage', { message: '   ' }), 'Message cannot be empty.');
  const stranger = connect(url, { transports: ['websocket'] });
  await once(stranger, 'connect');
  assert.match(await emitAck(stranger, 'sendMessage', { message: 'x' }), /rejoin/);

  // Leaving updates the room
  const left = once(alice, 'message');
  bob.disconnect();
  assert.match((await left).text, /bob has left/);

  // Works without an ack callback
  stranger.emit('join', { username: 'carol', room: 'general' });
  await once(stranger, 'welcome');

  alice.disconnect();
  stranger.disconnect();
  io.close();
  server.close();
  console.log('socket tests passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
