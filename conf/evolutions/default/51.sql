# --- !Ups

alter table stub add column trashed boolean;

# --- !Downs

alter table stub drop column trashed;
