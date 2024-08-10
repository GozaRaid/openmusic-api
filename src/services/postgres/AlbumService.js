const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const { mapDBToModelAlbum, mapDBToModelSong } = require('../../utils');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
    const createAt = new Date().toISOString();

    const query = {
      text: 'INSERT INTO albums (id, name, year, created_at, updated_at) VALUES($1, $2, $3, $4, $4) RETURNING id',
      values: [id, name, year, createAt],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }
    return result.rows[0].id;
  }

  async getAlbumById(id) {
    const albumQuery = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [id],
    };
    const Albumresult = await this._pool.query(albumQuery);
    if (!Albumresult.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const Album = mapDBToModelAlbum(Albumresult.rows[0]);

    const songsQuery = {
      text: 'SELECT id, title, performer FROM songs WHERE "albumId" = $1',
      values: [id],
    };
    const Songsresult = await this._pool.query(songsQuery);

    const Songs = Songsresult.rows.map(mapDBToModelSong);
    return {
      ...Album,
      songs: Songs,
    };
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui Album. Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async editAlbumCoverById(id, cover) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET cover = $1, updated_at = $2 WHERE id = $3 RETURNING id',
      values: [cover, updatedAt, id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui Album. Id tidak ditemukan');
    }
  }

  async addLikeAlbumById(AlbumId, userId) {
    const id = `albumlike-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) ON CONFLICT (user_id, album_id) DO NOTHING RETURNING id',
      values: [id, userId, AlbumId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Like sudah ada. Like gagal ditambahkan');
    }
    await this._cacheService.delete(`album:${AlbumId}:likes`);
  }

  async deleteLikeAlbumById(AlbumId, userId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id',
      values: [userId, AlbumId],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Like gagal dihapus. Id tidak ditemukan');
    }
    await this._cacheService.delete(`album:${AlbumId}:likes`);
  }

  async getAlbumLikesByAlbumId(AlbumId) {
    try {
      const result = await this._cacheService.get(`album:${AlbumId}:likes`);
      return {
        cache: true,
        likes: JSON.parse(result),
      };
    } catch (error) {
      const query = {
        text: 'SELECT user_id FROM user_album_likes WHERE album_id = $1',
        values: [AlbumId],
      };
      const result = await this._pool.query(query);
      await this._cacheService.set(`album:${AlbumId}:likes`, JSON.stringify(result.rowCount), 1800);
      return {
        cache: false,
        likes: result.rowCount,
      };
    }
  }
}

module.exports = AlbumService;
