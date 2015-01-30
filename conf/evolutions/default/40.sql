# --- !Ups

UPDATE content SET composer_last_modified = (SELECT last_modified FROM content c1 WHERE content.composer_id = c1.composer_id);


# --- !Downs

UPDATE content SET composer_last_modified = null;
