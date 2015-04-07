# --- !Ups

CREATE TABLE plan_item
(
    id serial NOT NULL PRIMARY KEY,
    title text NOT NULL,
    news_list integer not null REFERENCES news_list (pk),
    planned_date TIMESTAMP NOT NULL
);

# --- !Downs

DROP table plan_item
