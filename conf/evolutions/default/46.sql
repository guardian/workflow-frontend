# --- !Ups

CREATE TABLE newsList(
    pk serial primary key,
    title varchar(128) not null unique
);

# --- !Downs

DROP table newsList
