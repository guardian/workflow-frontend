# --- !Ups
ALTER TABLE content ALTER COLUMN status TYPE character varying(32);

# --- !Downs
ALTER TABLE content ALTER COLUMN status TYPE character varying(16);
