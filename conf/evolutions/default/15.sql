# --- !Ups

ALTER TABLE stub ADD prod_office VARCHAR(20) NOT NULL DEFAULT 'UK';

# --- !Downs

ALTER TABLE stub DROP prod_office;
