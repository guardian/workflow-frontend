# --- !Ups

ALTER TABLE stub ADD note VARCHAR(500);

# --- !Downs

ALTER TABLE stub DROP note;
