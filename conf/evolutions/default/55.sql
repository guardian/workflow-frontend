# --- !Ups

ALTER TABLE stub add column commissioning_desks text;

# --- !Downs

ALTER TABLE stub drop column commissioning_desks;


