# --- !Ups

ALTER TABLE content ADD COLUMN storyBundleId VARCHAR(100), ADD COLUMN activeInInCopy BOOLEAN NOT NULL DEFAULT false;

# --- !Downs

ALTER TABLE content DROP COLUMN  storyBundleId, DROP COLUMN activeInInCopy;
