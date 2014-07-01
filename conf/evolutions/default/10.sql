
# --- !Ups

ALTER TABLE content ADD time_published timestamp;

# --- !Downs

ALTER TABLE content DROP time_published