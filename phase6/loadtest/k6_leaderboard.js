import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('error_rate');

export const options = {
  scenarios: {
    leaderboard_stress: {
      executor: 'constant-vus',
      vus: 200,
      duration: '120s',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<100'],
    'error_rate': ['rate<0.005'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8000';
const TIMEFRAMES = ['daily', 'weekly', 'monthly', 'all_time'];

export default function () {
  const tf = TIMEFRAMES[Math.floor(Math.random() * TIMEFRAMES.length)];
  const page = Math.floor(Math.random() * 5) + 1;

  const res = http.get(`${BASE_URL}/api/v1/leaderboard/${tf}?page=${page}&page_size=25`, {
    headers: {
      'Accept': 'application/json',
      'X-Request-ID': `k6-lb-${__VU}-${__ITER}`,
    },
  });

  const success = check(res, {
    'status is 200': (r) => r.status === 200,
    'has entries': (r) => JSON.parse(r.body).entries !== undefined,
  });

  if (!success) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  sleep(0.5);
}
