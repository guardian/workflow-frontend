# --- !Ups

ALTER TABLE stub ADD created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

# --- !Downs

ALTER TABLE stub DROP created_at
