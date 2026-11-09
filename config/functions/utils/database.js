'use strict';

/**
 * Persistence for chat members, backed by the Strapi "users" collection.
 * Each record is one connected socket (username + room + socketId).
 */
const service = () => strapi.services.users;

module.exports = {
  async findUser(username, room) {
    return (await service().find({ username, room })) || [];
  },

  async createUser({ username, room, socketId }) {
    return service().create({ username, room, status: 'ONLINE', socketId });
  },

  async findBySocketId(socketId) {
    const users = (await service().find({ socketId })) || [];
    return users[0] || null;
  },

  async getUsersInRoom(room) {
    return (await service().find({ room, _limit: -1 })) || [];
  },

  async deleteUser(socketId) {
    const deleted = await service().delete({ socketId });
    return Array.isArray(deleted) ? deleted : [deleted].filter(Boolean);
  },

  /** Remove members left over from a previous process (their sockets are gone). */
  async clearAll() {
    const all = (await service().find({ _limit: -1 })) || [];
    await Promise.all(all.map((u) => service().delete({ id: u.id })));
    return all.length;
  },
};
