
# --- !Ups

ALTER TABLE content ADD headline VARCHAR(128);

# --- !Downs

ALTER TABLE content DROP headline;
