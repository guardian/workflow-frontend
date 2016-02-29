# --- !Ups

ALTER TABLE stub alter column content_type SET NOT NULL;
ALTER TABLE stub alter column content_type SET DEFAULT 'article';

# --- !Downs

ALTER TABLE stub alter column content_type drop not null;

