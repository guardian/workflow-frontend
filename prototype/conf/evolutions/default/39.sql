# --- !Ups
alter table content add column composer_last_modified TIMESTAMP;

# --- !Downs
alter table content drop column composer_last_modified;
