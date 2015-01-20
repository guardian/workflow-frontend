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


### Initial request
Tests response times of initial page GET request.

Target: All 400 users hit page within a minute = 400 requests per minute = 6.7 r/s

URL: https://workflow.code.dev-gutools.co.uk/dashboard

Load (r/s) | Min | Max | Average | Max CPU | Max DB CPU | Throughput | Notes
-----------|----:|----:|--------:|--------:|-----------:|-----------:|------
20         |


### Initial API request
Tests response times of initial API request during page load. Compares effect of DB size on response times

Target: All 400 users hit page within a minute = 400 requests per minute = 6.7 r/s

URL: https://workflow.code.dev-gutools.co.uk/dashboard

Load (r/s) | Min | Max | Average | Max CPU | Max DB CPU | Throughput | Notes
-----------|----:|----:|--------:|--------:|-----------:|-----------:|----
20         |     |     |         |         |            |            | 1000 DB rows (100 visible in API)
20         |     |     |         |         |            |            | 1000 DB rows (200 visible in API)
20         |     |     |         |         |            |            | 1000 DB rows (500 visible in API)
20         |     |     |         |         |            |            | 2000 DB rows (100 visible in API)
20         |     |     |         |         |            |            | 5000 DB rows (100 visible in API)


### API poll every 5 seconds
Tests response times of polled API request.

Target: All 400 users poll every 5 seconds = 80 r/s

Load (r/s) | Min | Max | Average | Max CPU | Max DB CPU | Throughput | Notes
-----------|----:|----:|--------:|--------:|-----------:|-----------:|----
40         |     |     |         |         |            |            | 1000 DB rows (100 visible in API)
80         |     |     |         |         |            |            | 1000 DB rows (100 visible in API)
