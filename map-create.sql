CREATE EXTENSION IF NOT EXISTS postgis;

-- Points: buildings, clients, муфт, sites
CREATE TABLE map_nodes (
  id          SERIAL PRIMARY KEY,
  name        TEXT,
  description TEXT,
  node_type   TEXT,        -- 'joint','building','client','site'
  location    GEOMETRY(Point, 4326),
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Lines: all cable routes
CREATE TABLE cable_segments (
  id          SERIAL PRIMARY KEY,
  name        TEXT,
  core_count  INT,         -- 1, 4, 8, 24, 48
  cable_type  TEXT,        -- 'fiber','ftp','backbone'
  path        GEOMETRY(LineString, 4326),
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Polygons: coverage zones
CREATE TABLE coverage_zones (
  id          SERIAL PRIMARY KEY,
  name        TEXT,
  area        GEOMETRY(Polygon, 4326),
  details     JSONB
);

-- Spatial indexes
CREATE INDEX ON map_nodes      USING GIST(location);
CREATE INDEX ON cable_segments USING GIST(path);
CREATE INDEX ON coverage_zones USING GIST(area);
