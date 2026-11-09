'use strict';

if (!process.env.JWT_SECRET) {
  throw new Error('Missing required environment variable JWT_SECRET. Copy .env.example to .env and set it.');
}

module.exports = {
  jwtSecret: process.env.JWT_SECRET,
};
