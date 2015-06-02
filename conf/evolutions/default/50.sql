# --- !Ups

ALTER TABLE news_list ADD default_section INTEGER REFERENCES section (pk);

# --- !Downs

ALTER TABLE news_list DROP COLUMN default_section;
