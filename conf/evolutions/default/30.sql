# --- !Ups

CREATE TABLE archive
(
    pk serial NOT NULL PRIMARY KEY
  , stub_id integer
  , composer_id character varying(32)
  , was_deleted boolean not null DEFAULT false
  , working_title character varying(128)
  , section character varying(128)
  , content_type character varying(16)
  , prod_office character varying(20)
  , created_at timestamp without time zone
  , last_modified timestamp without time zone
  , status character varying(16)
  , headline character varying(300)
  , path character varying(512)
  , published boolean not null default false
  , time_published timestamp without time zone
  , revision integer
  , storybundleid character varying(100)
  , activeinincopy boolean not null default false
  , takendown boolean not null default false
  , time_takendown timestamp without time zone
  , mainmedia character varying(32)
);


# --- !Downs

DROP TABLE archive;
