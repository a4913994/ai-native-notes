CREATE TABLE IF NOT EXISTS news_digests (
  id INTEGER PRIMARY KEY,
  date TEXT NOT NULL,
  language TEXT NOT NULL,
  payload TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CONSTRAINT news_day_language UNIQUE(date, language)
);
--> statement-breakpoint
UPDATE info SET value = '13' WHERE key = 'migration_version';
