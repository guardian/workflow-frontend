# --- !Ups

ALTER TABLE plan_item ALTER COLUMN planned_date DROP NOT NULL;

# --- !Downs

ALTER TABLE plan_item ALTER COLUMN planned_date SET NOT NULL;
