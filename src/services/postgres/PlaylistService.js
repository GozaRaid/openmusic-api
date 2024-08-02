const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistService {
  constructor() {
    this._pool = new Pool();
  }

  async addPlaylist({ name, owner }) {
    const id = `playlist-${nanoid(16)}`;
    const createAt = new Date().toISOString();
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3, $4, $4) RETURNING id',
      values: [id, name, owner, createAt],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }
    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: 'SELECT p.id, p.name, u.username FROM playlists p JOIN users u ON p.owner = u.id WHERE owner = $1',
      values: [owner],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async getPlaylistById(id, owner) {
    const query = {
      text: 'SELECT p.id, p.name, u.username FROM playlists p JOIN users u ON p.owner = u.id WHERE p.id = $1 AND p.owner = $2',
      values: [id, owner],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    return result.rows[0];
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Playlist gagal dihapus. Id tidak ditemukan');
    }
  }

  async addSongToPlaylist(playlistId, songId) {
    const id = `playlist_song-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };
    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }
    return result.rows[0].id;
  }

  async getSongsByPlaylistId(playlistId) {
    const query = {
      text: 'SELECT s.id, s.title, s.performer FROM songs s JOIN playlist_songs ps ON s.id = ps.song_id WHERE playlist_id = $1',
      values: [playlistId],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async deleteSongFromPlaylist(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal dihapus dari playlist');
    }
  }

  async verifyPlaylistOwner(owner, playlistId) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [playlistId],
    };
    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan');
    }

    const playlist = result.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }
}

module.exports = PlaylistService;
