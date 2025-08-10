-- D1 schema
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS credentials (
  userId TEXT NOT NULL,
  credentialId TEXT PRIMARY KEY,
  publicKey TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- User data for syncing (JSON blob); single row per user
CREATE TABLE IF NOT EXISTS user_data (
  userId TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);


