
# --- !Ups

-- We can no longer have content that is not linked to a stub.
DELETE FROM content WHERE NOT EXISTS (SELECT * FROM stub WHERE stub.composer_id = content.composer_id);

ALTER TABLE content ADD CONSTRAINT stub_fkey FOREIGN KEY (composer_id) REFERENCES stub (composer_id);

# --- !Downs

ALTER TABLE content DROP CONSTRAINT stub_fkey;
