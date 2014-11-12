# Contributing

## Database evolution

First the actual database change. Add a new file containing the SQL
commands to apply your change to the database, and *also to remove
it*. This will allow your database change to be automatically applied
and unapplied as required. See the
[Play documentation][https://www.playframework.com/documentation/2.2.x/Evolutions]
about evolutions for more details.

	# --- !Ups
	ALTER TABLE content ADD COLUMN testcol varchar(10);
	
	# --- !Downs
	ALTER TABLE content DROP COLUMN testcol;

You can test the `!Downs` portion of the script by simply deleting (or
moving) your evolutions file and reloading Workflow. Play should
detect that the evultion is no longer required, and automatically
apply the downgrade statements.
