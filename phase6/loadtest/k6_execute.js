import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Custom trends & error metrics
const executeE2E = new Trend('execute_e2e');
const errorRate = new Rate('error_rate');

export const options = {
  scenarios: {
    classroom_spike: {
      executor: 'constant-vus',
      vus: 50,
      duration: '60s',
    },
  },
  thresholds: {
    'http_req_duration{status:202}': ['p(95)<200', 'p(99)<500'],
    'execute_e2e': ['p(95)<4000'],
    'error_rate': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8000';

export default function () {
  const payload = JSON.stringify({
    challenge_id: 'c01-two-sum',
    code: `def solve(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`,
  });

  const headers = {
    'Content-Type': 'application/json',
    'X-Request-ID': `k6-${__VU}-${__ITER}-${Date.now()}`,
  };

  const submitStart = Date.now();
  const res = http.post(`${BASE_URL}/api/v1/execute`, payload, { headers });

  const enqueueOk = check(res, {
    'status is 202': (r) => r.status === 202,
    'has job_id': (r) => JSON.parse(r.body).job_id !== undefined,
  });

  if (!enqueueOk) {
    errorRate.add(1);
    sleep(2);
    return;
  }

  const body = JSON.parse(res.body);
  const jobId = body.job_id;

  // Poll until complete or timeout
  let complete = false;
  let attempts = 0;
  while (!complete && attempts < 20) {
    sleep(0.2);
    attempts++;
    const pollRes = http.get(`${BASE_URL}/api/v1/submissions/${jobId}`, { headers });
    if (pollRes.status === 200) {
      const pollBody = JSON.parse(pollRes.body);
      if (pollBody.status === 'complete' || pollBody.status === 'failed') {
        complete = true;
        const e2eDuration = Date.now() - submitStart;
        executeE2E.add(e2eDuration);
        check(pollBody, {
          'submission completed': (b) => b.status === 'complete',
        });
      }
    }
  }

  if (!complete) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  sleep(2);
}
