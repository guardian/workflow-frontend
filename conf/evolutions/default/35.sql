# --- !Ups
ALTER TABLE stub ADD COLUMN assign_to_email TEXT;

# --- !Downs

ALTER TABLE stub DROP COLUMN assign_to_email;
