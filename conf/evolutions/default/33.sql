# --- !Ups
ALTER TABLE content ALTER COLUMN content_type SET NOT NULL

# --- !Downs

ALTER TABLE content ALTER COLUMN content_type DROP NOT NULL
