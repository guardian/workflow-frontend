# --- !Ups

insert into section (section) values ('Developer-Blog');

# --- !Downs

delete from section where section in ('Developer-Blog');
