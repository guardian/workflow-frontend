# --- !Ups

CREATE TABLE news_list(
    pk serial NOT NULL PRIMARY KEY,
    title varchar(128) not null unique
);

# --- !Downs

DROP table news_list
