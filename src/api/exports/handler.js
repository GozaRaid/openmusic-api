const autoBind = require('auto-bind');

class ExportsHandler {
  constructor(producerService, playlistService, validator) {
    this._producerService = producerService;
    this._playlistService = playlistService;
    this._validator = validator;
    autoBind(this);
  }

  async postExportPlaylistByIdHandler(request, h) {
    this._validator.validateExportPlaylist(request.payload);

    const message = {
      userId: request.auth.credentials.id,
      playlistId: request.params.playlistId,
      targetEmail: request.payload.targetEmail,
    };
    await this._playlistService.verifyPlaylistOwner(message.playlistId, message.userId);
    await this._producerService.sendMessage('export:playlist', JSON.stringify(message));

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda sedang kami proses',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
