
# --- !Ups
ALTER TABLE stub add column wf_last_modified TIMESTAMP;

UPDATE stub SET wf_last_modified = (SELECT last_modified FROM content WHERE content.composer_id = stub.composer_id);
UPDATE stub SET wf_last_modified = now() where wf_last_modified IS NULL;

ALTER TABLE stub ALTER COLUMN  wf_last_modified SET NOT NULL;

ALTER TABLE stub ALTER COLUMN  wf_last_modified SET DEFAULT now();


# --- !Downs
alter table stub drop column wf_last_modified;

