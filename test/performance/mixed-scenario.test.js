import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// Mixed scenario performance test for Lann Thailand Loan App
export const errorRate = new Rate('errors');
export const responseTime = new Trend('response_time');

export let options = {
  scenarios: {
    // Scenario 1: Regular users performing basic operations
    regular_users: {
      executor: 'ramping-vus',
      exec: 'regularUserFlow',
      startVUs: 5,
      stages: [
        { duration: '5m', target: 10 },   // Ramp up to 10 VUs
        { duration: '10m', target: 10 },  // Hold at 10 VUs
        { duration: '5m', target: 0 },    // Ramp down to 0
      ],
      gracefulStop: '30s',
    },
    // Scenario 2: Power users performing multiple operations
    power_users: {
      executor: 'ramping-vus',
      exec: 'powerUserFlow',
      startVUs: 2,
      stages: [
        { duration: '5m', target: 5 },    // Ramp up to 5 VUs
        { duration: '10m', target: 5 },   // Hold at 5 VUs
        { duration: '5m', target: 0 },    // Ramp down to 0
      ],
      gracefulStop: '30s',
    },
    // Scenario 3: Occasional traffic spikes
    traffic_spikes: {
      executor: 'constant-vus',
      exec: 'simpleRequests',
      vus: 3,
      duration: '25m',
      gracefulStop: '30s',
    }
  },
  thresholds: {
    'http_req_duration': ['p(95)<300', 'p(99)<500'], // 95% of requests under 300ms, 99% under 500ms
    'http_req_failed': ['rate<0.02'],                 // Less than 2% failure rate
    'errors': ['rate<0.02'],                          // Less than 2% errors
    'checks': ['rate>0.98'],                          // More than 98% checks pass
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Mock user data
const USERS = [
  { email: 'user1@example.com', password: 'SecurePassword1!', id: 'user1' },
  { email: 'user2@example.com', password: 'SecurePassword2!', id: 'user2' },
  { email: 'user3@example.com', password: 'SecurePassword3!', id: 'user3' },
  { email: 'user4@example.com', password: 'SecurePassword4!', id: 'user4' },
  { email: 'user5@example.com', password: 'SecurePassword5!', id: 'user5' },
];

// Regular user flow: Basic operations
export function regularUserFlow() {
  const user = USERS[Math.floor(Math.random() * USERS.length)];
  
  // Login
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });
  
  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const loginStart = new Date();
  const loginRes = http.post(`${BASE_URL}/api/users/login`, loginPayload, loginParams);
  responseTime.add(new Date() - loginStart);
  
  const loginSuccess = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'response time under 500ms': (r) => (new Date() - loginStart) < 500,
  });
  
  errorRate.add(!loginSuccess);
  
  if (!loginSuccess) {
    console.log(`Login failed for ${user.email}: ${loginRes.status} - ${loginRes.body}`);
    return;
  }
  
  const authToken = loginRes.json().token;
  
  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  };
  
  // View dashboard/profile
  const profileStart = new Date();
  const profileRes = http.get(`${BASE_URL}/api/users/profile`, authHeaders);
  responseTime.add(new Date() - profileStart);
  
  check(profileRes, {
    'profile view successful': (r) => r.status === 200,
    'response time under 300ms': (r) => (new Date() - profileStart) < 300,
  });
  
  // View loans
  const loansStart = new Date();
  const loansRes = http.get(`${BASE_URL}/api/loans/user/${user.id}?status=active`, authHeaders);
  responseTime.add(new Date() - loansStart);
  
  check(loansRes, {
    'loans view successful': (r) => r.status === 200,
    'response time under 300ms': (r) => (new Date() - loansStart) < 300,
  });
  
  // Small wait to simulate user thinking time
  sleep(Math.random() * 2 + 1);
}

// Power user flow: Multiple operations in sequence
export function powerUserFlow() {
  const user = USERS[Math.floor(Math.random() * USERS.length)];
  
  // Login
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });
  
  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const loginStart = new Date();
  const loginRes = http.post(`${BASE_URL}/api/users/login`, loginPayload, loginParams);
  responseTime.add(new Date() - loginStart);
  
  const loginSuccess = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'response time under 500ms': (r) => (new Date() - loginStart) < 500,
  });
  
  errorRate.add(!loginSuccess);
  
  if (!loginSuccess) {
    console.log(`Login failed for ${user.email}: ${loginRes.status} - ${loginRes.body}`);
    return;
  }
  
  const authToken = loginRes.json().token;
  
  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  };
  
  group('Power User Operations', () => {
    // View profile
    const profileStart = new Date();
    const profileRes = http.get(`${BASE_URL}/api/users/profile`, authHeaders);
    responseTime.add(new Date() - profileStart);
    
    check(profileRes, {
      'profile view successful': (r) => r.status === 200,
      'response time under 300ms': (r) => (new Date() - profileStart) < 300,
    });
    
    // View credit status
    const creditsStart = new Date();
    const creditsRes = http.get(`${BASE_URL}/api/credits/user/${user.id}`, authHeaders);
    responseTime.add(new Date() - creditsStart);
    
    check(creditsRes, {
      'credits view successful': (r) => r.status === 200,
      'response time under 300ms': (r) => (new Date() - creditsStart) < 300,
    });
    
    // Apply for a loan (simulated)
    const loanPayload = JSON.stringify({
      loanAmount: Math.floor(Math.random() * 50000) + 5000,
      term: Math.floor(Math.random() * 30) + 6,
      purpose: 'personal',
      repaymentSchedule: 'monthly'
    });
    
    const loanStart = new Date();
    const loanRes = http.post(`${BASE_URL}/api/loans/apply`, loanPayload, authHeaders);
    responseTime.add(new Date() - loanStart);
    
    check(loanRes, {
      'loan application submitted': (r) => r.status === 201 || r.status === 400, // Allow 400 for validation
      'response time under 500ms': (r) => (new Date() - loanStart) < 500,
    });
    
    // View repayment schedule
    const repaymentsStart = new Date();
    const repaymentsRes = http.get(`${BASE_URL}/api/repayments/loan/${'test-loan-id'}`, authHeaders);
    responseTime.add(new Date() - repaymentsStart);
    
    check(repaymentsRes, {
      'repayments view successful': (r) => r.status === 200 || r.status === 404, // Allow 404 if no repayments
      'response time under 300ms': (r) => (new Date() - repaymentsStart) < 300,
    });
    
    // Update preferences
    const prefPayload = JSON.stringify({
      language: Math.random() > 0.5 ? 'en' : 'th',
      notifications: {
        email: true,
        sms: Math.random() > 0.5,
        push: true
      },
      theme: Math.random() > 0.5 ? 'light' : 'dark'
    });
    
    const prefStart = new Date();
    const prefRes = http.put(`${BASE_URL}/api/users/preferences`, prefPayload, authHeaders);
    responseTime.add(new Date() - prefStart);
    
    check(prefRes, {
      'preferences update successful': (r) => r.status === 200,
      'response time under 400ms': (r) => (new Date() - prefStart) < 400,
    });
  });
  
  // Longer wait to simulate power user behavior
  sleep(Math.random() * 4 + 2);
}

// Simple requests for baseline traffic
export function simpleRequests() {
  // Simple health check
  const healthStart = new Date();
  const healthRes = http.get(`${BASE_URL}/api/health`);
  responseTime.add(new Date() - healthStart);
  
  check(healthRes, {
    'health check successful': (r) => r.status === 200,
    'response time under 100ms': (r) => (new Date() - healthStart) < 100,
  });
  
  // Small wait
  sleep(Math.random() * 1 + 0.5);
}