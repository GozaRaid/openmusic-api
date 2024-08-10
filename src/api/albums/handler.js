const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(albumService, storageService, validator) {
    this._albumService = albumService;
    this._storageService = storageService;
    this._validator = validator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;

    const albumId = await this._albumService.addAlbum({ name, year });
    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const album = await this._albumService.getAlbumById(id);
    const response = h.response({
      status: 'success',
      data: {
        album,
      },
    });
    response.code(200);
    return response;
  }

  async putAlbumByIdHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._albumService.editAlbumById(id, request.payload);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil diperbarui',
    });
    response.code(200);
    return response;
  }

  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;
    await this._albumService.deleteAlbumById(id);
    const response = h.response({
      status: 'success',
      message: 'Album berhasil dihapus',
    });
    response.code(200);
    return response;
  }

  async postAlbumCoverByIdHandler(request, h) {
    const { id } = request.params;
    const { cover } = request.payload;
    this._validator.validateAlbumCoverHeaders(cover.hapi.headers);

    const filename = await this._storageService.writeFile(cover, cover.hapi);
    const url = `http://${process.env.HOST}:${process.env.PORT}/albums/images/${filename}`;
    await this._albumService.editAlbumCoverById(id, url);
    const response = h.response({
      status: 'success',
      message: 'Lampiran berhasil diunggah',
    });
    response.code(201);
    return response;
  }

  async postAlbumLikeByIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._albumService.getAlbumById(id);
    await this._albumService.addLikeAlbumById(id, credentialId);
    const response = h.response({
      status: 'success',
      message: 'Album berhasil di-like',
    });
    response.code(201);
    return response;
  }

  async deleteAlbumLikeByIdHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._albumService.deleteLikeAlbumById(id, credentialId);
    const response = h.response({
      status: 'success',
      message: 'Album berhasil di-unlike',
    });
    response.code(200);
    return response;
  }

  async getAlbumLikesByIdHandler(request, h) {
    const { id } = request.params;
    const { cache, likes } = await this._albumService.getAlbumLikesByAlbumId(id);
    const response = h.response({
      status: 'success',
      data: {
        likes,
      },
    });
    if (cache) {
      response.header('X-Data-Source', 'cache');
    } else {
      response.header('X-Data-Source', 'database');
    }
    response.code(200);
    return response;
  }
}

module.exports = AlbumsHandler;
