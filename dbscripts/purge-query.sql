--create a temporary table
create table Temp(stub_id Integer, composer_id varchar(32) null);

--insert composer ids and stubids into a temp table which return different results from the query
insert into Temp(stub_id, composer_id) select x2.pk, x3.composer_id from stub x2, content x3 where x2.composer_id = x3.composer_id and pk in
(select x2.pk from "stub" x2, "content" x3 where (x2."composer_id" = x3."composer_id")
and (not (((x3."status" = 'Final') and x3."published") and (x3."last_modified" <  now() - interval '24 hours'))))
and pk not in
(select x2.pk from "stub" x2, "content" x3 where (x2."composer_id" = x3."composer_id")
   and (((((x3."time_published" > now() - interval '1 day') or (x3."time_published" is null))
   and ((x2."due" > '2015-01-12 11:01:52.815') or (x2."due" is null)))
   and (((x3."last_modified" > now() - interval '7 days') or (x2."due" > now())) or (x3."time_published" is null)))
   or (x3."status" = 'Hold')))

--insert the unlinked stubs which would now be surfaced

insert into Temp(stub_id) select x2.pk from stub x2 where pk in
                         (select x2.pk from "stub" x2 where x2."composer_id" is null) and pk not in
                         (select x2.pk from "stub" x2 where x2."composer_id" is null and ((x2."due" is null) or (x2."due" > now() - interval '7 days')));

select * from Temp;

--add to archive with a left outer join
insert into archive (stub_id, composer_id, was_deleted, working_title, section, content_type, prod_office, created_at,
last_modified, status, headline, path, published, time_published, revision, storybundleid, activeinincopy, takendown,
time_takendown) select x2.pk, x3.composer_id, false, x2.working_title, x2.section, x3.content_type, x2.prod_office,
x2.created_at, x3.last_modified, x3.status, x3.headline, x3.path, x3.published, x3.time_published, x3.revision,
x3.storybundleid, x3.activeinincopy, x3.takendown, x3.time_takendown from stub x2 left outer join content x3
on x2.composer_id = x3.composer_id where x2.pk in (select stub_id from Temp);

delete from content where composer_id in (select x2.composer_id from stub x2, content x3 where x2.composer_id = x3.composer_id and x2.pk in (select stub_id from Temp));
delete from stub where stub.pk in (select stub_id from Temp);





