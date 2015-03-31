# --- !Ups

ALTER TABLE content ADD optimised_for_web BOOLEAN NOT NULL DEFAULT FALSE;

# --- !Downs

ALTER TABLE content DROP COLUMN optimised_for_web;