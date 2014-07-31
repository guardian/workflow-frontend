
# --- !Ups

insert into section (section) values ('Cities'), ('Technology'), ('Dev');

# --- !Downs

delete from section where section in ('Cities', 'Technology', 'Dev');