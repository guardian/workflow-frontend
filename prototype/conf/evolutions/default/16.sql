
# --- !Ups

create table section(pk serial primary key, section varchar(128) not null unique);

# --- !Downs

drop table section;