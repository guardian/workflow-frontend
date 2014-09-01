
# --- !Ups

ALTER TABLE stub ADD created_at TIMESTAMP;

# --- !Downs

ALTER TABLE stub DROP created_at;
