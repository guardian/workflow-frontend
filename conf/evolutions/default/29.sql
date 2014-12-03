# --- !Ups

ALTER TABLE content ADD COLUMN mainmedia VARCHAR(32);

# --- !Downs

ALTER TABLE content DROP COLUMN mainmedia;

