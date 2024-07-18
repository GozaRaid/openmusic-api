class ClientError extends Error {
  constructor(message, errorCode = 400) {
    super(message);
    this.statusCode = errorCode;
    this.name = 'ClientError';
  }
}

module.exports = ClientError;
