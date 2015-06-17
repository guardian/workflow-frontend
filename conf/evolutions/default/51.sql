
# --- !Ups
alter table stub add column killed boolean;

# --- !Downs
alter table stub drop column killed;
