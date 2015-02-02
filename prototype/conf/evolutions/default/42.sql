# --- !Ups

ALTER TABLE stub ALTER COLUMN wf_last_modified SET NOT NULL;


# --- !Downs

ALTER TABLE stub ALTER COLUMN wf_last_modified DROP NOT NULL;


