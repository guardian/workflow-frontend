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


## Observations
TODO


## Test results
r/s = Simulated requests per second


### Initial request (dashboard)
Tests response times of initial page GET request.

Endpoint makes database queries, retrieving statuses, desks, and sections.

**Target:** All 400 users hit page within a minute = 400 requests per minute = 6.7 r/s

**URL:** https://workflow.code.dev-gutools.co.uk/dashboard

Load (r/s) | Min | Max   | Average | Max CPU | Max DB CPU | Throughput | Notes
-----------|----:|------:|--------:|--------:|-----------:|-----------:|------
7          | 123 | 9468  | 246     | 40%     | 6.8%       | 5.1/s      |
20         | 119 | 60162 | 1159    | 94%     | 16%        | 13.9/s     |

Observed high CPU usage on EC2s. Probably caused by synchronous waits from DB calls.

Expected throughput of 7/s. 73% of target reached. Result would be slow page load under heavy load.


### Initial API request
Tests response times of initial API request during page load. Compares effect of DB size on response times

**Target:** All 400 users hit page within a minute = 400 requests per minute = 6.7 r/s

**URL:** https://workflow.code.dev-gutools.co.uk/api/content

Load (r/s) | Min | Max | Average | Max CPU | Max DB CPU | Throughput | Notes
-----------|----:|----:|--------:|--------:|-----------:|-----------:|----
7          |     |     |         |         |            |            | 1000 DB rows (100 visible in API)
20         |     |     |         |         |            |            | 1000 DB rows (100 visible in API)
7          |     |     |         |         |            |            | 1000 DB rows (200 visible in API)
20         |     |     |         |         |            |            | 1000 DB rows (200 visible in API)
7          |     |     |         |         |            |            | 1000 DB rows (500 visible in API)
20         |     |     |         |         |            |            | 1000 DB rows (500 visible in API)
20         |     |     |         |         |            |            | 2000 DB rows (100 visible in API)
20         |     |     |         |         |            |            | 5000 DB rows (100 visible in API)


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
