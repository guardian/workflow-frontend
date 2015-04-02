# --- !Ups

CREATE TABLE plan_item
(
    id character varying(32) NOT NULL PRIMARY KEY,
    title text NOT NULL,
    news_list integer not null REFERENCES news_list (pk)
);

# --- !Downs

DROP table plan_item
