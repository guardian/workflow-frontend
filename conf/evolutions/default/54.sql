# --- !Ups

ALTER TABLE content ALTER COLUMN content_type DROP NOT NULL;

# --- !Downs

ALTER TABLE stub ALTER COLUMN content_type SET NULL;
