'use strict';

const requireEnv = (env, name) => {
  const value = env(name);
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. Copy .env.example to .env and set it.`);
  }
  return value;
};

// Loopback for local development. Render/Heroku need an all-interfaces bind,
// so default to 0.0.0.0 when their env markers are present; HOST overrides.
const defaultHost = process.env.RENDER || process.env.DYNO ? '0.0.0.0' : '127.0.0.1';

module.exports = ({ env }) => ({
  host: env('HOST', defaultHost),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', ''),
  admin: {
    auth: {
      secret: requireEnv(env, 'ADMIN_JWT_SECRET'),
    },
  },
});
