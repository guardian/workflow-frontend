Archiver
=========

Archiver is a daily 'cron' job, which runs daily at 2am. Its purpose is to move content which has not been modified
for more than a month from the 'current' table to archive table, so that our current db doesn't grow indefinitely large.

***Running the app***
./kick-archiver.sh
