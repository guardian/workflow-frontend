
# --- !Ups

ALTER TABLE content ADD published BOOLEAN not null default false;

# --- !Downs

ALTER TABLE content DROP published;
