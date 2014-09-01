
# --- !Ups

UPDATE stub SET created_at = (SELECT last_modified FROM content WHERE stub.composer_id = content.composer_id);


# --- !Downs

UPDATE stub SET created_at = null;