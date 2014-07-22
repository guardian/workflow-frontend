
# --- !Ups

AlTER TABLE content add revision integer;

# --- !Downs

ALTER TABLE content drop revision;