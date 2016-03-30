# --- !Ups

ALTER TABLE stub add column commissioning_desks character varying(300);

# --- !Downs

ALTER TABLE stub drop column commissioning_desks;


