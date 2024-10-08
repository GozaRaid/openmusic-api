require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const Inert = require('@hapi/inert');
const path = require('path');
const config = require('./utils/config');

const ClientError = require('./exceptions/ClientError');

// albums
const albums = require('./api/albums');
const AlbumsValidator = require('./validator/albums');
const AlbumService = require('./services/postgres/AlbumService');

// songs
const songs = require('./api/songs');
const SongsValidator = require('./validator/songs');
const SongService = require('./services/postgres/SongService');

// users
const users = require('./api/users');
const UsersValidator = require('./validator/users');
const UserService = require('./services/postgres/UserService');

// authentications
const authentications = require('./api/authentications');
const AuthenticationsValidator = require('./validator/authentications');
const AuthenticationService = require('./services/postgres/AuthenticationService');
const TokenManager = require('./tokenize/TokenManager');

// playlist
const playlist = require('./api/playlists');
const PlaylistValidator = require('./validator/playlists');
const PlaylistService = require('./services/postgres/PlaylistService');

// collaborations
const collaborations = require('./api/collaborations');
const CollaborationsValidator = require('./validator/collaborations');
const CollaborationService = require('./services/postgres/CollaborationService');

// exports
const _exports = require('./api/exports');
const ProducerService = require('./services/rabbitmq/ProducerService');
const ExportsValidator = require('./validator/exports');

// uploads
const StorageService = require('./services/storage/StorageService');

// cache
const CacheService = require('./services/redis/CacheService');

const init = async () => {
  const cacheService = new CacheService();
  const collaborationService = new CollaborationService();
  const albumService = new AlbumService(cacheService);
  const songService = new SongService();
  const userService = new UserService();
  const authenticationService = new AuthenticationService();
  const playlistService = new PlaylistService(collaborationService);
  const storageService = new StorageService(path.resolve(__dirname, 'api/albums/file/images'));

  const server = Hapi.server({
    port: config.app.port,
    host: config.app.host,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register([
    {
      plugin: Jwt,
    },
    {
      plugin: Inert,
    },
  ]);

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: config.token.accessTokenKey,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: config.token.ageTokenKey,
    },
    validate: (artifacts) => ({
      isValid: true,
      credentials: {
        id: artifacts.decoded.payload.id,
      },
    }),
  });

  await server.register([
    {
      plugin: albums,
      options: {
        albumsService: albumService,
        storagesService: storageService,
        validator: AlbumsValidator,
      },
    },
    {
      plugin: songs,
      options: {
        service: songService,
        validator: SongsValidator,
      },
    },
    {
      plugin: users,
      options: {
        service: userService,
        validator: UsersValidator,
      },
    },
    {
      plugin: authentications,
      options: {
        authenticationsService: authenticationService,
        usersService: userService,
        tokenManager: TokenManager,
        validator: AuthenticationsValidator,
      },
    },
    {
      plugin: playlist,
      options: {
        playlistsService: playlistService,
        songsService: songService,
        validator: PlaylistValidator,
      },
    },
    {
      plugin: collaborations,
      options: {
        collaborationsService: collaborationService,
        playlistsService: playlistService,
        usersService: userService,
        validator: CollaborationsValidator,
      },
    },
    {
      plugin: _exports,
      options: {
        producersService: ProducerService,
        playlistsService: playlistService,
        validator: ExportsValidator,
      },
    },
  ]);

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }

      if (!response.isServer) {
        return h.continue;
      }
      const newResponse = h.response({
        status: 'error',
        message: 'terjadi kegagalan pada server kami',
      });
      newResponse.code(500);
      return newResponse;
    }
    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
