
# --- !Ups

ALTER TABLE stub ADD priority integer not null default 0;

# --- !Downs

ALTER TABLE stub DROP priority;