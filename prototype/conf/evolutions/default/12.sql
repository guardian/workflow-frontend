
# --- !Ups

ALTER TABLE stub ADD needs_legal varchar(16) NOT NULL DEFAULT 'NA';

# --- !Downs

ALTER TABLE stub DROP needs_legal;