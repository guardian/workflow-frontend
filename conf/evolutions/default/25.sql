# --- !Ups

create table desk(pk serial primary key, desk varchar(128) not null unique);

# --- !Downs

drop table desk;

