# --- !Ups

UPDATE stub SET wf_last_modified = (SELECT last_modified FROM content WHERE content.composer_id = stub.composer_id);
UPDATE stub SET wf_last_modified = now() where wf_last_modified is null;


# --- !Downs

UPDATE stub SET wf_last_modified = null;
