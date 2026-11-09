'use strict';

module.exports = ({ env }) => {
  const uri = env('DATABASE_URI');
  if (!uri) {
    throw new Error('Missing required environment variable DATABASE_URI (MongoDB connection string).');
  }
  return {
    defaultConnection: 'default',
    connections: {
      default: {
        connector: 'mongoose',
        settings: { uri },
        options: {
          // mongodb+srv:// (Atlas) negotiates TLS itself; set DATABASE_SSL=true to force it.
          ssl: env.bool('DATABASE_SSL', false),
        },
      },
    },
  };
};
