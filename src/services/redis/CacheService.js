const redis = require('redis');
const config = require('../../utils/config');

class CacheService {
  constructor() {
    this._client = redis.createClient({
      socket: {
        host: config.redis.host,
      },
    });

    this._client.on('error', (error) => {
      console.log(error);
    });

    this._client.connect();
  }

  async set(key, value, expirationInSecond) {
    await this._client.set(key, value, {
      EX: expirationInSecond,
    });
  }

  async get(key) {
    const value = await this._client.get(key);

    if (value === null) throw new Error('Cache tidak ditemukan');

    return value;
  }

  async delete(key) {
    await this._client.del(key);
  }
}

module.exports = CacheService;
