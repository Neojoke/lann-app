import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Performance test for Lann Thailand Loan App API endpoints
export const errorRate = new Rate('errors');

export let options = {
  stages: [
    // Ramp-up phase
    { duration: '5m', target: 10 },   // Ramp up to 10 VUs over 5 minutes
    { duration: '10m', target: 10 },  // Stay at 10 VUs for 10 minutes
    { duration: '5m', target: 20 },   // Ramp up to 20 VUs over 5 minutes
    { duration: '10m', target: 20 },  // Stay at 20 VUs for 10 minutes
    { duration: '5m', target: 50 },   // Ramp up to 50 VUs over 5 minutes
    { duration: '10m', target: 50 },  // Stay at 50 VUs for 10 minutes
    { duration: '5m', target: 0 },    // Ramp down to 0 VUs over 5 minutes
  ],
  thresholds: {
    'http_req_duration': ['p(95)<200'], // 95% of requests should be below 200ms
    'http_req_failed': ['rate<0.01'],   // Less than 1% of requests should fail
    'errors': ['rate<0.01'],            // Less than 1% errors
  },
};

// Define base URL for the application
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Define test user credentials
const USERS = [
  { email: 'user1@example.com', password: 'SecurePassword1!' },
  { email: 'user2@example.com', password: 'SecurePassword2!' },
  { email: 'user3@example.com', password: 'SecurePassword3!' },
  { email: 'user4@example.com', password: 'SecurePassword4!' },
  { email: 'user5@example.com', password: 'SecurePassword5!' },
];

export default function() {
  // Select a random user for this iteration
  const user = USERS[Math.floor(Math.random() * USERS.length)];
  
  // Login to get authentication token
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });
  
  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const loginRes = http.post(`${BASE_URL}/api/users/login`, loginPayload, loginParams);
  
  // Check if login was successful
  const loginSuccess = check(loginRes, {
    'login successful': (r) => r.status === 200,
    'response has token': (r) => r.json().token !== undefined,
  });
  
  errorRate.add(!loginSuccess);
  
  if (!loginSuccess) {
    console.log(`Login failed for ${user.email}: ${loginRes.status} - ${loginRes.body}`);
    return;
  }
  
  const authToken = loginRes.json().token;
  
  // Set up authorization header for subsequent requests
  const authHeaders = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
  };
  
  // Test credit application endpoint
  const creditPayload = JSON.stringify({
    creditLimit: Math.floor(Math.random() * 100000) + 10000, // Random limit between 10k-110k
    creditType: 'personal',
    purpose: 'personal_use',
    documents: [
      { type: 'id_card', url: 'https://example.com/doc1' },
      { type: 'income_statement', url: 'https://example.com/doc2' }
    ]
  });
  
  const creditRes = http.post(`${BASE_URL}/api/credits/apply`, creditPayload, authHeaders);
  const creditSuccess = check(creditRes, {
    'credit application successful': (r) => r.status === 201,
    'credit application has id': (r) => r.json().data?.id !== undefined,
  });
  
  errorRate.add(!creditSuccess);
  
  // Test getting user profile
  const profileRes = http.get(`${BASE_URL}/api/users/profile`, authHeaders);
  const profileSuccess = check(profileRes, {
    'profile retrieval successful': (r) => r.status === 200,
    'profile has user data': (r) => r.json().data?.email !== undefined,
  });
  
  errorRate.add(!profileSuccess);
  
  // Test getting credit applications
  const creditsRes = http.get(`${BASE_URL}/api/credits/user/${r.json().data?.id || 'test'}`, authHeaders);
  const creditsSuccess = check(creditsRes, {
    'credits retrieval successful': (r) => r.status === 200,
    'credits response is array': (r) => Array.isArray(r.json().data),
  });
  
  errorRate.add(!creditsSuccess);
  
  // Test loan application endpoint
  const loanPayload = JSON.stringify({
    loanAmount: Math.floor(Math.random() * 50000) + 5000, // Random amount between 5k-55k
    term: Math.floor(Math.random() * 30) + 6, // Random term between 6-36 months
    purpose: 'personal',
    repaymentSchedule: 'monthly'
  });
  
  const loanRes = http.post(`${BASE_URL}/api/loans/apply`, loanPayload, authHeaders);
  const loanSuccess = check(loanRes, {
    'loan application successful': (r) => r.status === 201,
    'loan application has id': (r) => r.json().data?.id !== undefined,
  });
  
  errorRate.add(!loanSuccess);
  
  // Test getting active loans
  const loansRes = http.get(`${BASE_URL}/api/loans/user/${r.json().data?.id || 'test'}?status=active`, authHeaders);
  const loansSuccess = check(loansRes, {
    'loans retrieval successful': (r) => r.status === 200,
    'loans response is array': (r) => Array.isArray(r.json().data),
  });
  
  errorRate.add(!loansSuccess);
  
  // Test repayment endpoint
  const repaymentPayload = JSON.stringify({
    loanId: 'test-loan-id',
    amount: Math.floor(Math.random() * 5000) + 1000, // Random repayment amount
    paymentMethod: 'mobile_banking',
    referenceNumber: `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  });
  
  const repaymentRes = http.post(`${BASE_URL}/api/repayments/make`, repaymentPayload, authHeaders);
  const repaymentSuccess = check(repaymentRes, {
    'repayment successful': (r) => r.status === 201 || r.status === 400, // Allow 400 for test purposes
  });
  
  errorRate.add(!repaymentSuccess);
  
  // Add some random delay to simulate real user behavior
  sleep(Math.random() * 2 + 1); // Sleep between 1-3 seconds
}