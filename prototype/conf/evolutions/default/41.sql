CREATE OR REPLACE FUNCTION update_lastmodified_column()
        RETURNS TRIGGER AS '
  BEGIN
      NEW.wf_last_modified = now();
      RETURN NEW;
  END;
' LANGUAGE 'plpgsql';

CREATE TRIGGER update_lastmodified_modtime BEFORE UPDATE
  ON stub FOR EACH ROW EXECUTE PROCEDURE
  update_lastmodified_column();
