# --- !Ups

ALTER TABLE content ADD COLUMN wc INTEGER;

# --- !Downs

ALTER TABLE content DROP COLUMN wc;

