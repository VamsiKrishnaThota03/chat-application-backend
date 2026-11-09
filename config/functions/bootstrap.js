'use strict';

const { Server } = require('socket.io');
const store = require('./utils/database');
const { registerChatHandlers } = require('./socket');

/** Allowed browser origins for Socket.IO: CORS_ORIGINS (comma-separated), with the legacy vars as fallback. */
function allowedOrigins() {
  const configured = [process.env.CORS_ORIGINS, process.env.CUSTOM_DOMAIN, process.env.REACT_APP_URL]
    .filter(Boolean)
    .join(',')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return configured.length > 0 ? configured : ['http://localhost:3000'];
}

/**
 * Runs before the server starts: attaches Socket.IO to Strapi's HTTP server.
 * See https://strapi.io/documentation/developer-docs/latest/setup-deployment-guides/configurations.html#bootstrap
 */
module.exports = async () => {
  // Member records describe live sockets; anything left from a previous run is stale.
  const stale = await store.clearAll();
  if (stale > 0) strapi.log.info(`Removed ${stale} stale chat member(s) from a previous run`);

  const io = new Server(strapi.server, {
    cors: {
      origin: allowedOrigins(),
      methods: ['GET', 'POST'],
    },
    maxHttpBufferSize: 1e5,
  });

  registerChatHandlers(io, store, strapi.log);
  strapi.io = io;
};
