
-- Create stubs
INSERT INTO public.stub (working_title, section, content_type, due, priority)
SELECT 'LOADTEST: stub-' || x.id, 'Dev', 'article', NOW() + '1 day'::INTERVAL * ROUND(RANDOM() * 100), ROUND(RANDOM() * 2)
    FROM generate_series(1,50) AS x(id);

-- Create Content in with status
INSERT INTO public.content (composer_id, last_modified, last_modified_by, headline, status, content_type)
SELECT 'LOADTEST_' || x.id, NOW(), 'LOADTEST_USER', 'LOADTEST: headline', 'Revise', 'article'
    FROM generate_series(1,50) AS x(id);

INSERT INTO public.stub (composer_id, working_title, section, content_type, due, priority)
SELECT 'LOADTEST_' || x.id, 'LOADTEST: content-' || x.id, 'Dev', 'article', NOW() + '1 day'::INTERVAL * ROUND(RANDOM() * 100), ROUND(RANDOM() * 2)
    FROM generate_series(1,50) AS x(id);

-- Create Content to be filtered out (published in past)
INSERT INTO public.content (composer_id, last_modified, last_modified_by, headline, status, content_type, time_published)
SELECT 'LOADTEST_OLD_' || x.id, NOW(), 'LOADTEST_USER', 'LOADTEST: headline', 'Revise', 'article', '2014-08-14'
    FROM generate_series(1,1000) AS x(id);

INSERT INTO public.stub (composer_id, working_title, section, content_type)
SELECT 'LOADTEST_OLD_' || x.id, 'LOADTEST: content-' || x.id, 'Dev', 'article'
    FROM generate_series(1,1000) AS x(id);