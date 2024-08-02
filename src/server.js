require('dotenv').config();

const Hapi = require('@hapi/hapi');
const Jwt = require('@hapi/jwt');
const ClientError = require('./exceptions/ClientError');

// album
const albums = require('./api/albums');
const AlbumsValidator = require('./validator/albums');
const AlbumService = require('./services/postgres/AlbumService');

// song
const songs = require('./api/songs');
const SongsValidator = require('./validator/songs');
const SongService = require('./services/postgres/SongService');

// user
const users = require('./api/users');
const UserService = require('./services/postgres/UserService');
const UsersValidator = require('./validator/users');

// authentications
const authentications = require('./api/authentications');
const AuthenticationsValidator = require('./validator/authentications');
const AuthenticationService = require('./services/postgres/AuthenticationService');
const TokenManager = require('./tokenize/TokenManager');

// playlist
const playlist = require('./api/playlists');
const PlaylistValidator = require('./validator/playlists');
const PlaylistService = require('./services/postgres/PlaylistService');

const init = async () => {
  const albumService = new AlbumService();
  const songService = new SongService();
  const userService = new UserService();
  const authenticationService = new AuthenticationService();
  const playlistService = new PlaylistService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
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
  ]);

  server.auth.strategy('openmusic_jwt', 'jwt', {
    keys: process.env.ACCESS_TOKEN_KEY,
    verify: {
      aud: false,
      iss: false,
      sub: false,
      maxAgeSec: process.env.ACCESS_TOKEN_AGE,
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
        service: albumService,
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
