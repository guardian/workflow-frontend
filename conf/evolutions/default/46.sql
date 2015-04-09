# --- !Ups

CREATE TABLE plan_item
(
    id SERIAL NOT NULL PRIMARY KEY,
    title TEXT NOT NULL,
    news_list INTEGER NOT NULL REFERENCES news_list (pk),
    planned_date TIMESTAMP NOT NULL,
    by_line TEXT,
    notes TEXT,
    bundle_id TEXT,
    created TIMESTAMP NOT NULL ,
    priority INTEGER NOT NULL
);

# --- !Downs

DROP table plan_item
