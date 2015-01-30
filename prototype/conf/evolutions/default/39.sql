# --- !Ups
alter table stub add column wf_last_modified TIMESTAMP;

# --- !Downs
alter table stub drop column wf_last_modified;
