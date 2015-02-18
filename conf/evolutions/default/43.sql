# --- !Ups

CREATE TABLE collaborator
(
  email text NOT NULL,
  composer_id character varying(32) NOT NULL REFERENCES content ON DELETE CASCADE,
  PRIMARY KEY (email, composer_id)
);

# --- !Downs

DROP table collaborator
