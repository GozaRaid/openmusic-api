const mapDBToModelAlbum = ({
  id,
  name,
  year,
  created_at,
  updated_at,
}) => ({
  id,
  name,
  year,
  createdAt: created_at,
  updatedAt: updated_at,
});

const mapDBToModelSong = ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  album_id,
  created_at,
  updated_at,
}) => ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  albumId: album_id,
  createdAt: created_at,
  updatedAt: updated_at,
});

const mapDBToModelPlaylist = ({
  id,
  name,
  username,
}) => ({
  id,
  name,
  username,
});

module.exports = {
  mapDBToModelAlbum,
  mapDBToModelSong,
  mapDBToModelPlaylist,
};
