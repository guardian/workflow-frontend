# --- !Ups

create table desk(pk serial primary key, desk varchar(128) not null unique);
create table section_desk_mapping(section_id integer not null,desk_id integer not null);

# --- !Downs

drop table desk;
drop table section_desk_mapping;
