# --- !Ups
ALTER TABLE archive ALTER COLUMN status TYPE character varying(32);

# --- !Downs
ALTER TABLE archive ALTER COLUMN status TYPE character varying(16);
