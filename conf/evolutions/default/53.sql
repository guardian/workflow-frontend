# --- !Ups

ALTER TABLE stub set content_type NOT NULL default 'article';

# --- !Downs

ALTER TABLE stub set content_type drop not null;

