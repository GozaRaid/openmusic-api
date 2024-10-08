const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const { mapDBToModelSong } = require('../../utils');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class SongService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({
    title, year, genre, performer, duration, albumId,
  }) {
    const id = `song-${nanoid(16)}`;
    const createAt = new Date().toISOString();

    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7, $8, $8) RETURNING id',
      values: [id, title, year, genre, performer, duration, albumId, createAt],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }
    return result.rows[0].id;
  }

  async getSongs(query) {
    let baseQuery = 'SELECT id, title, performer FROM songs WHERE 1=1';
    const queryParams = [];

    if (query.title) {
      queryParams.push(`%${query.title}%`);
      baseQuery += ` AND title ILIKE $${queryParams.length}`;
    }

    if (query.performer) {
      queryParams.push(`%${query.performer}%`);
      baseQuery += ` AND performer ILIKE $${queryParams.length}`;
    }

    const { rows, rowCount } = await this._pool.query(baseQuery, queryParams);
    if (!rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }
    return rows;
  }

  async getSongById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };
    const { rows, rowCount } = await this._pool.query(query);
    if (!rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }
    return mapDBToModelSong(rows[0]);
  }

  async editSongById(id, {
    title,
    year,
    genre,
    performer,
    duration,
  }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, updated_at = $6 WHERE id = $7 RETURNING id',
      values: [title, year, genre, performer, duration, updatedAt, id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = SongService;
