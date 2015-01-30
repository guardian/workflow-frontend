# --- !Ups

ALTER TABLE content ALTER COLUMN composer_last_modified SET DEFAULT now();
