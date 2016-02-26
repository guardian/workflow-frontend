# --- !Ups

ALTER TABLE stub alter column content_type SET NOT NULL default 'article';

# --- !Downs

ALTER TABLE stub alter column content_type drop not null;
