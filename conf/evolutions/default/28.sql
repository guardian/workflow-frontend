# --- !Ups

ALTER TABLE content ADD COLUMN takendown BOOLEAN NOT NULL DEFAULT false, ADD COLUMN time_takendown timestamp without time zone; 

# --- !Downs

ALTER TABLE content DROP COLUMN takendown, DROP COLUMN time_takendown;
