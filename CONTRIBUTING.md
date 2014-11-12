# Contributing

## Javascript

This project uses an ES6 subset compiled at build time to ES5 by Traceur.

Please consult [this page to see which parts of the ES6 spec are supported by Traceur](https://github.com/google/traceur-compiler/wiki/LanguageFeatures).

## Modifying the database

### Database evolution

First the actual database change. Add a new file containing the SQL
commands to apply your change to the database, and *also to remove
it*. This will allow your database change to be automatically applied
and unapplied as required. See the
[Play documentation](https://www.playframework.com/documentation/2.2.x/Evolutions)
about evolutions for more details.

	# --- !Ups
	ALTER TABLE content ADD COLUMN testcol varchar(10);
	
	# --- !Downs
	ALTER TABLE content DROP COLUMN testcol;

You can test the `!Downs` portion of the script by simply deleting (or
moving) your evolutions file and reloading Workflow. Play should
detect that the evolution is no longer required, and automatically
apply the downgrade statements.
