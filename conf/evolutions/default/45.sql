# --- !Ups

CREATE TABLE news_list(
    pk serial primary key,
    title varchar(128) not null unique
);

# --- !Downs

DROP table news_list
