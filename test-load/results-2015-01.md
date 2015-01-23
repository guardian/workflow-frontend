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
7          | 182  | 21455 | 403     | 56%     | 3%         | 6.3/s      | 1000 DB rows (200 visible in API)
20         | 352  | 10900 | 1979    | 100%    | 4.6%       | 9.9/s      | 1000 DB rows (200 visible in API)
7          | 183  | 3452  | 360     | 55%     | 3.7%       | 6/s        | 1100 DB rows (200 visible in API)
20         | 249  | 47237 | 1997    | 99%     | 4.3%       | 9.9/s      | 1100 DB rows (200 visible in API)
7          | 333  | 4994  | 1493    | 99%     | 3.77%      | 4.5/s      | 1000 DB rows (500 visible in API)
20 (DNT)   |      |       |         |         |            |            | 1000 DB rows (500 visible in API)
7          | 122  | 9640  | 237     | 35%     | 6.5%       | 6.7/s      | 2000 DB rows (100 visible in API)
20         |      |       |         |         |            |            | 2000 DB rows (100 visible in API)
7          | 104  | 2378  | 137     | 36%     | 12%        | 7/s        | 5000 DB rows (100 visible in API)
20         | 276  | 6155  | 1180    | 99%     | 26%        | 15.9/s     | 5000 DB rows (100 visible in API)
7          | 107  | 1045  | 136     | 33%     | 21%        | 7/s        | 10000 DB rows (100 visible in API)
20         | 300  | 2986  | 1098    | 99%     | 49%        | 16.9/s     | 10000 DB rows (100 visible in API)
7          | 825  | 3064  | 1965    | 20%     | 100%       | 3.5/s      | 100000 DB rows (100 visible in API)
7          | ~300 | 3699  | 513     | 76%     | 7.6%       | 6.8/s      | PROD dump 2015-01-19 (232 visible in API)

DNT = Did Not Test

"DB rows" are number of rows in both the `content` and `stub` table.

PROD dump from 2015-01-19 has 5777 in `content` table, 5788 in `stub`. 227 content and 5 stubs visible in API.

Tests show higher instance CPU, slower response times on larger API responses (rows visible)

Result: Pass at target load.

### API poll every 5 seconds
Tests response times of polled API request.

**Target:** All 400 users poll every 5 seconds = 80 r/s

**URL:** https://workflow.code.dev-gutools.co.uk/api/content

Load (r/s) | Min | Max   | Average | Max CPU | Max DB CPU | Throughput | Notes
-----------|----:|------:|--------:|--------:|-----------:|-----------:|----
20         | 343 | 1020  | 2363    | 99%     | 8%         | 17.6/s     | 1000 DB rows (100 visible in API)
40         | 176 | 7264  | 2284    | 99%     | 8%         | 17.1/s     | 1000 DB rows (100 visible in API)
80         | 112 | 11252 | 4470    | 99%     | 8%         | 16.5%      | 1000 DB rows (100 visible in API)

Tests show max throughput wall at ~16/s for the API on current config. Minimal DB CPU suggests instances are the bottleneck.

Double checked performance via remote test, confirmed.

Result: Acceptable. Responses will be slow at max low.

#### 2 instances cross-zone
Retested via remote with Cross-Zone Load Balancing: on!
Load (r/s) | Min | Max   | Average | Max CPU | Max DB CPU | Throughput | Notes
-----------|----:|------:|--------:|--------:|-----------:|-----------:|----
40         | 270 | 3064  | 1135    | 99%     | 14%        | 32.8/s     | 1000 DB rows (100 visible in API)

Result: Acceptable. Better performance at 82% of target.

#### 3 instances cross-zone
3 instances. 1 per EU-West-1 AZ. Cross-Zone Load Balancing: on!
Load (r/s) | Min | Max   | Average | Max CPU | Max DB CPU | Throughput | Notes
-----------|----:|------:|--------:|--------:|-----------:|-----------:|----
40         | 33  | 5149  | 105     | 76%     | 17%        | 39.4/s     | 1000 DB rows (100 visible in API)
80         | 224 | 4878  | 1511    | 99%     | 8%         | 50.2/s     | 1000 DB rows (100 visible in API)

Result: Pass! Great performance at target load.

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
