# --- !Ups

create table section_desk_mapping(
    section_id  integer     not null REFERENCES section (pk)
  , desk_id     integer     not null REFERENCES desk (pk)
);

# --- !Downs

drop table section_desk_mapping;
