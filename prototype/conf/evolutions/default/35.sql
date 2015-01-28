# --- !Ups
ALTER TABLE content
    ADD COLUMN embargoed_until timestamp without time zone,
    ADD COLUMN embargoed_indefinitely boolean not null DEFAULT false

# --- !Downs
ALTER TABLE content
    DROP COLUMN embargoed_until,
    DROP COLUMN embargoed_indefinitely
