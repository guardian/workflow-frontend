
# --- !Ups

ALTER TABLE content ADD commentable BOOLEAN NOT NULL DEFAULT FALSE;

# --- !Downs

ALTER TABLE content DROP COLUMN commentable;
