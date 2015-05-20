# --- !Ups

CREATE TABLE bundle
(
    pk SERIAL NOT NULL PRIMARY KEY,
    title TEXT NOT NULL
);

INSERT INTO bundle VALUES (0, 'No bundle');

# --- !Downs

DROP table bundle
