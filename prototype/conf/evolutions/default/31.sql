# --- !Ups

ALTER TABLE content 
    ADD COLUMN mainmedia_url TEXT, 
    ADD COLUMN mainmedia_caption TEXT,
    ADD COLUMN mainmedia_alttext TEXT,
    ADD COLUMN trailimage_url TEXT, 
    ADD COLUMN standfirst TEXT, 
    ADD COLUMN trailtext  TEXT; 

# --- !Downs

ALTER TABLE content
    DROP COLUMN mainmedia_url,
    DROP COLUMN mainmedia_caption,
    DROP COLUMN mainmedia_alttext,
    DROP COLUMN trailimage_url,
    DROP COLUMN standfirst,
    DROP COLUMN trailtext;
