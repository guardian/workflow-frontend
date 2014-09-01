
# --- !Ups
UPDATE stub SET created_at = CURRENT_TIMESTAMP where created_at = null;
