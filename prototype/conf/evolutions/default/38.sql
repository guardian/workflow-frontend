# --- !Ups
alter table archive add column archived_at TIMESTAMP not null default now();

# --- !Downs
alter table archive drop column archived_at;
