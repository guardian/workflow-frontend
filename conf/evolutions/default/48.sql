# --- !Ups

CREATE TABLE day_note
(
    pk SERIAL NOT NULL PRIMARY KEY,
    note TEXT NOT NULL,
    day TIMESTAMP NOT NULL,
    news_list INTEGER NOT NULL REFERENCES news_list (pk)
);

# --- !Downs

DROP table day_note
