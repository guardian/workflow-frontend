# Workflow load testing analysis
**Date:** January 2015

**Target:** "400 users"

## Result Summary
TODO


## Test overview

Testing for 400 concurrent users.

Testing considerations:
- Workflow has 1 "dynamic" html response, which is loaded on page load only. Ideally only requested once per day, but users could request all at once.
- More sections now, with a Desk mapping, extra load/lookups in Database
- Tested for a single API request on load
- API Polled every 5 seconds for each user (constant load)
- 84 client-side assets from original test, retested for comparison
- 120 assets now requested on page load

Setup:
- Tests run on CODE environment: https://workflow.code.dev-gutools.co.uk/
- Each test runs for ~5 mins
- CODE app scaled to 2 m3.medium EC2 instances (same config as PROD)
- Run using Apache JMeter from Guardian UK Office London
- System Monitoring via AWS Cloudwatch / Workflow Radiator pointed to CODE


## Observations
TODO


## Test results
r/s = Simulated requests per second


### Initial request (dashboard)
Tests response times of initial page GET request.

Endpoint makes database queries, retrieving desks, and sections.

**Target:** All 400 users hit page within a minute = 400 requests per minute = 6.7 r/s

**URL:** https://workflow.code.dev-gutools.co.uk/dashboard

Load (r/s) | Min | Max   | Average | Max CPU | Max DB CPU | Throughput | Notes
-----------|----:|------:|--------:|--------:|-----------:|-----------:|------
7          | 123 | 9468  | 246     | 40%     | 6.8%       | 5.1/s      |
20         | 119 | 60162 | 1159    | 94%     | 16%        | 13.9/s     |

45 rows in `sections` table. 28 in `desks`. 67 in `section_desk_mapping`. From PROD DB dump 2015-01-19.

Observed high CPU usage on EC2s. Probably caused by synchronous waits from DB calls.

Expected throughput of 7/s. 73% of target reached. Result would be slow page load under heavy load.


### Initial API request
Tests response times of initial API request during page load. Compares effect of DB size on response times

**Target:** All 400 users hit page within a minute = 400 requests per minute = 6.7 r/s

**URL:** https://workflow.code.dev-gutools.co.uk/api/content

Load (r/s) | Min  | Max   | Average | Max CPU | Max DB CPU | Throughput | Notes
-----------|-----:|------:|--------:|--------:|-----------:|-----------:|----
7          | 120  | 4205  | 277     | 30%     | 3%         | 6/s        | 1000 DB rows (100 visible in API)
20         | 129  | 45230 | 783     | 99%     | 5.6%       | 16/s       | 1000 DB rows (100 visible in API)
7          | 182  | 21455 | 403     | 56%     | 3%         | 6.3%       | 1000 DB rows (200 visible in API)
20         |      |       |         |         |            |            | 1000 DB rows (200 visible in API)
7          |      |       |         |         |            |            | 1100 DB rows (200 visible in API)
20         |      |       |         |         |            |            | 1100 DB rows (200 visible in API)
7          |      |       |         |         |            |            | 1000 DB rows (500 visible in API)
20         |      |       |         |         |            |            | 1000 DB rows (500 visible in API)
7          |      |       |         |         |            |            | 2000 DB rows (100 visible in API)
20         |      |       |         |         |            |            | 2000 DB rows (100 visible in API)
7          |      |       |         |         |            |            | 5000 DB rows (100 visible in API)
20         |      |       |         |         |            |            | 5000 DB rows (100 visible in API)
7          | ~300 | 3699  | 513   | 76%     | 7.6%       | 6.8/s      | PROD dump 2015-01-19 (232 visible in API)

"DB rows" are number of rows in both the `content` and `stub` table.

PROD dump from 2015-01-19 has 5777 in `content` table, 5788 in `stub`. 227 content and 5 stubs visible in API.


### API poll every 5 seconds
Tests response times of polled API request.

**Target:** All 400 users poll every 5 seconds = 80 r/s

**URL:** https://workflow.code.dev-gutools.co.uk/api/content

Load (r/s) | Min | Max | Average | Max CPU | Max DB CPU | Throughput | Notes
-----------|----:|----:|--------:|--------:|-----------:|-----------:|----
40         |     |     |         |         |            |            | 1000 DB rows (100 visible in API)
80         |     |     |         |         |            |            | 1000 DB rows (100 visible in API)


### Asset requests
Tests response times of asset requests in browser. Browser uses 4 threads to load assets per user.

**Target:** All 400 users hit page within a minute = 400 requests per minute = 6.7 users/s

**URL:** https://workflow.code.dev-gutools.co.uk/assets/{asset_url}

Load (r/s)     | Min | Max  | Average | Max CPU | Max DB CPU | Throughput | Notes
---------------|----:|-----:|--------:|--------:|-----------:|-----------:|----
588 (7 users)  | 13  | 1126 | 43      | 45%     | ~1%        | 521.6/s    | 84 asset requests across 4 threads
840 (10 users) | 13  | 557  | 45      | 68%     | ~1%        | 725.2/s    | 84 asset requests across 4 threads

Observed high CPU probably caused by serving assets via Play / JVM.

Expected throughput 588/s. 89% of ideal target reached. Result would be slow load of assets at max capacity.
