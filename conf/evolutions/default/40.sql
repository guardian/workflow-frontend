
# --- !Ups
ALTER TABLE stub add column wf_last_modified TIMESTAMP DEFAULT now() NOT NULL;

UPDATE stub SET wf_last_modified = (SELECT last_modified FROM content WHERE content.composer_id = stub.composer_id)
WHERE stub.composer_id in (SELECT composer_id FROM content);

# --- !Downs
alter table stub drop column wf_last_modified;
