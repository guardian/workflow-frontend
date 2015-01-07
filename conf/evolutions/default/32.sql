# --- !Ups

ALTER TABLE content ADD COLUMN wordCount INTEGER default 0;

# --- !Downs

ALTER TABLE content DROP COLUMN wordCount;

