# --- !Ups
ALTER TABLE content
    ADD COLUMN scheduled_launch_date timestamp without time zone

# --- !Downs
ALTER TABLE content
    DROP COLUMN scheduled_launch_date
