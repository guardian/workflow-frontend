# --- !Ups

ALTER TABLE stub ALTER COLUMN wf_last_modified SET DEFAULT now();

# --- !Downs

ALTER TABLE stub ALTER COLUMN wf_last_modified DROP DEFAULT;

