const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(playlistService, songService, validator) {
    this._playlistService = playlistService;
    this._songService = songService;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload);
    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    const playlistId = await this._playlistService.addPlaylist(name, credentialId);
    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: {
        playlistId,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request, h) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this._playlistService.getPlaylists(credentialId);
    const response = h.response({
      status: 'success',
      data: {
        playlists,
      },
    });
    response.code(200);
    return response;
  }

  async deletePlaylistByIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._playlistService.verifyPlaylistOwner(id, credentialId);
    await this._playlistService.deletePlaylistById(id);
    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil dihapus',
    });
    response.code(200);
    return response;
  }

  async postPlaylistSongByIdHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { songId } = request.payload;
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._songService.getSongById(songId);
    await this._playlistService.verifyPlaylistAccess(id, credentialId);
    await this._playlistService.addSongToPlaylist(songId, id);
    await this._playlistService.addPlaylistActivity(id, songId, credentialId, 'add');
    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil ditambahkan ke dalam playlist',
    });
    response.code(201);
    return response;
  }

  async getPlaylistSongByIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._playlistService.verifyPlaylistAccess(id, credentialId);
    const playlist = await this._playlistService.getPlaylistById(id, credentialId);
    const songs = await this._playlistService.getSongsByPlaylistId(id);
    playlist.songs = songs;
    const response = h.response({
      status: 'success',
      data: {
        playlist,
      },
    });
    response.code(200);
    return response;
  }

  async deletePlaylistSongByIdHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { songId } = request.payload;
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._playlistService.verifyPlaylistAccess(id, credentialId);
    await this._playlistService.deleteSongFromPlaylist(songId, id);
    await this._playlistService.addPlaylistActivity(id, songId, credentialId, 'delete');
    const response = h.response({
      status: 'success',
      message: 'Lagu berhasil dihapus dari playlist',
    });
    response.code(200);
    return response;
  }

  async getPlaylistActivitiesHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._playlistService.verifyPlaylistAccess(id, credentialId);
    const activities = await this._playlistService.getPlaylistActivities(id);
    const response = h.response({
      status: 'success',
      data: {
        playlistId: id,
        activities,
      },
    });
    response.code(200);
    return response;
  }
}

module.exports = PlaylistsHandler;
