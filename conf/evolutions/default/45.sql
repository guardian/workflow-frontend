# --- !Ups

CREATE TABLE plan_item
(
    id character varying(32) NOT NULL PRIMARY KEY,
    title text NOT NULL,
    newsList integer not null REFERENCES newsList (pk)
);

# --- !Downs

DROP table plan_item
