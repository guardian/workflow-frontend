# --- !Ups

ALTER TABLE news_list ADD default_section INTEGER NOT NULL REFERENCES section (pk) DEFAULT 1;

# --- !Downs

ALTER TABLE news_list DROP COLUMN default_section;
