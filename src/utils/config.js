const config = {
  app: {
    host: process.env.Host,
    port: process.env.Port,
  },
  rabbitMq: {
    server: process.env.RABBITMQ_SERVER,
  },
  redis: {
    host: process.env.REDIS_SERVER,
  },
  token: {
    accessTokenKey: process.env.ACCESS_TOKEN_KEY,
    refreshTokenKey: process.env.REFRESH_TOKEN_KEY,
    ageTokenKey: process.env.ACCESS_TOKEN_AGE,
  },
};

module.exports = config;
