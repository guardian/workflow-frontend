
# --- !Ups

ALTER TABLE stub ADD content_type varchar(16);

# --- !Downs

ALTER TABLE stub DROP content_type;
