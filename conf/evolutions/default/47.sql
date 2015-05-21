# --- !Ups

CREATE TABLE plan_item
(
    pk SERIAL NOT NULL PRIMARY KEY,
    title TEXT NOT NULL,
    news_list INTEGER NOT NULL REFERENCES news_list (pk),
    planned_date TIMESTAMP NOT NULL,
    by_line TEXT,
    notes TEXT,
    bundle_id INTEGER NOT NULL,
    created TIMESTAMP NOT NULL ,
    priority INTEGER NOT NULL,
    bucketed BOOLEAN NOT NULL,
    has_specific_time BOOLEAN NOT NULL,
    composer_id CHARACTER VARYING(32) UNIQUE
);

# --- !Downs

DROP table plan_item
