
# --- !Ups
ALTER TABLE stub add column wf_last_modified TIMESTAMP;

UPDATE stub SET wf_last_modified = created_at;

ALTER TABLE stub ALTER COLUMN  wf_last_modified SET NOT NULL;

ALTER TABLE stub ALTER COLUMN  wf_last_modified SET DEFAULT now();


# --- !Downs
alter table stub drop column wf_last_modified;

