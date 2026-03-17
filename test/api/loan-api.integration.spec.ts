import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../../backend/src/app'; // Adjust path as needed
import { testUser, testCredit, testLoan } from '../../fixtures/factory';
import { connectDB, closeDB } from '../../../backend/src/config/database'; // Adjust path as needed

describe('Loan API Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  // Test 1: POST /api/loans/apply - Valid loan application
  it('should successfully create a loan application with valid data', async () => {
    // First create a user and credit profile
    const user = testUser();
    const credit = testCredit();
    credit.userId = user.id;
    credit.status = 'approved'; // Ensure credit is approved
    
    // In a real scenario, we would need to create the user and credit first
    // For this test, we'll just test the loan application part
    const loanData = testLoan();
    loanData.userId = user.id;
    loanData.creditId = credit.id;

    const response = await request(app)
      .post('/api/loans/apply')
      .send(loanData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.userId).toBe(user.id);
    expect(response.body.data.status).toBe('submitted');
  });

  // Test 2: POST /api/loans/apply - Invalid loan data
  it('should return validation error for invalid loan application data', async () => {
    const invalidData = {
      userId: '', // Invalid: empty user ID
      loanAmount: -5000, // Invalid: negative amount
      term: 0, // Invalid: zero term
      interestRate: 'invalid_rate' // Invalid: not a number
    };

    const response = await request(app)
      .post('/api/loans/apply')
      .send(invalidData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });

  // Test 3: POST /api/loans/apply - Missing required fields
  it('should return validation error for missing required fields', async () => {
    const incompleteData = {
      userId: testUser().id
      // Missing required fields like loanAmount, term, etc.
    };

    const response = await request(app)
      .post('/api/loans/apply')
      .send(incompleteData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });

  // Test 4: GET /api/loans/:id - Valid loan ID
  it('should retrieve a loan application by ID', async () => {
    // First create a loan application
    const loanData = testLoan();
    const createResponse = await request(app)
      .post('/api/loans/apply')
      .send(loanData)
      .expect(201);

    const loanId = createResponse.body.data.id;

    const response = await request(app)
      .get(`/api/loans/${loanId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(loanId);
  });

  // Test 5: GET /api/loans/:id - Invalid ID format
  it('should return error for invalid loan ID format', async () => {
    const invalidId = 'invalid-id-format';

    const response = await request(app)
      .get(`/api/loans/${invalidId}`)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Invalid ID format');
  });

  // Test 6: GET /api/loans/:id - Non-existent ID
  it('should return not found for non-existent loan ID', async () => {
    const nonExistentId = '000000000000000000000000'; // Valid format but non-existent

    const response = await request(app)
      .get(`/api/loans/${nonExistentId}`)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Loan not found');
  });

  // Test 7: PUT /api/loans/:id/approve - Valid approval
  it('should successfully approve a loan application', async () => {
    // First create a loan application
    const loanData = testLoan();
    loanData.status = 'under_review'; // Ensure it's in review
    const createResponse = await request(app)
      .post('/api/loans/apply')
      .send(loanData)
      .expect(201);

    const loanId = createResponse.body.data.id;

    const approvalData = {
      approvedBy: testUser().id,
      approvedAt: new Date().toISOString(),
      approvedAmount: loanData.loanAmount,
      approvedTerm: loanData.term,
      disbursementDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
    };

    const response = await request(app)
      .put(`/api/loans/${loanId}/approve`)
      .send(approvalData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(loanId);
    expect(response.body.data.status).toBe('approved');
  });

  // Test 8: PUT /api/loans/:id/approve - Already approved loan
  it('should return error when trying to approve an already approved loan', async () => {
    // First create and approve a loan
    const loanData = testLoan();
    loanData.status = 'under_review';
    const createResponse = await request(app)
      .post('/api/loans/apply')
      .send(loanData)
      .expect(201);

    const loanId = createResponse.body.data.id;

    // Approve it first
    await request(app)
      .put(`/api/loans/${loanId}/approve`)
      .send({
        approvedBy: testUser().id,
        approvedAt: new Date().toISOString(),
        approvedAmount: loanData.loanAmount,
        approvedTerm: loanData.term,
        disbursementDate: new Date(Date.now() + 86400000).toISOString()
      })
      .expect(200);

    // Try to approve again
    const response = await request(app)
      .put(`/api/loans/${loanId}/approve`)
      .send({
        approvedBy: testUser().id,
        approvedAt: new Date().toISOString(),
        approvedAmount: loanData.loanAmount,
        approvedTerm: loanData.term,
        disbursementDate: new Date(Date.now() + 86400000).toISOString()
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('already approved');
  });

  // Test 9: PUT /api/loans/:id/reject - Valid rejection
  it('should successfully reject a loan application', async () => {
    // First create a loan application
    const loanData = testLoan();
    loanData.status = 'under_review';
    const createResponse = await request(app)
      .post('/api/loans/apply')
      .send(loanData)
      .expect(201);

    const loanId = createResponse.body.data.id;

    const rejectionData = {
      rejectedBy: testUser().id,
      rejectedAt: new Date().toISOString(),
      reason: 'Insufficient creditworthiness'
    };

    const response = await request(app)
      .put(`/api/loans/${loanId}/reject`)
      .send(rejectionData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(loanId);
    expect(response.body.data.status).toBe('rejected');
  });

  // Test 10: PUT /api/loans/:id/reject - Invalid rejection data
  it('should return validation error for invalid rejection data', async () => {
    // First create a loan application
    const loanData = testLoan();
    loanData.status = 'under_review';
    const createResponse = await request(app)
      .post('/api/loans/apply')
      .send(loanData)
      .expect(201);

    const loanId = createResponse.body.data.id;

    const invalidRejectionData = {
      rejectedBy: '', // Invalid: empty ID
      rejectedAt: 'invalid-date', // Invalid: wrong date format
      reason: '' // Invalid: empty reason
    };

    const response = await request(app)
      .put(`/api/loans/${loanId}/reject`)
      .send(invalidRejectionData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });

  // Test 11: GET /api/loans/user/:userId - Valid user
  it('should retrieve all loans for a user', async () => {
    const user = testUser();
    
    // Create multiple loans for the same user
    const loanData1 = testLoan();
    loanData1.userId = user.id;
    await request(app)
      .post('/api/loans/apply')
      .send(loanData1)
      .expect(201);

    const loanData2 = testLoan();
    loanData2.userId = user.id;
    await request(app)
      .post('/api/loans/apply')
      .send(loanData2)
      .expect(201);

    const response = await request(app)
      .get(`/api/loans/user/${user.id}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
  });

  // Test 12: GET /api/loans/user/:userId - User with no loans
  it('should return empty array for user with no loans', async () => {
    const fakeUserId = '000000000000000000000000'; // Valid format but non-existent

    const response = await request(app)
      .get(`/api/loans/user/${fakeUserId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(0);
  });

  // Test 13: PUT /api/loans/:id/disburse - Valid disbursement
  it('should successfully disburse an approved loan', async () => {
    // First create and approve a loan
    const loanData = testLoan();
    loanData.status = 'approved';
    const createResponse = await request(app)
      .post('/api/loans/apply')
      .send(loanData)
      .expect(201);

    const loanId = createResponse.body.data.id;

    const disbursementData = {
      disbursedBy: testUser().id,
      disbursementDate: new Date().toISOString(),
      transactionId: 'TXN' + Date.now()
    };

    const response = await request(app)
      .put(`/api/loans/${loanId}/disburse`)
      .send(disbursementData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(loanId);
    expect(response.body.data.status).toBe('disbursed');
    expect(response.body.data.disbursedAt).toBeDefined();
  });

  // Test 14: PUT /api/loans/:id/disburse - Attempt to disburse non-approved loan
  it('should return error when trying to disburse a non-approved loan', async () => {
    // First create a loan that's not yet approved
    const loanData = testLoan();
    loanData.status = 'submitted'; // Not approved yet
    const createResponse = await request(app)
      .post('/api/loans/apply')
      .send(loanData)
      .expect(201);

    const loanId = createResponse.body.data.id;

    const disbursementData = {
      disbursedBy: testUser().id,
      disbursementDate: new Date().toISOString(),
      transactionId: 'TXN' + Date.now()
    };

    const response = await request(app)
      .put(`/api/loans/${loanId}/disburse`)
      .send(disbursementData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('cannot be disbursed');
  });

  // Test 15: DELETE /api/loans/:id - Valid cancellation
  it('should successfully cancel a pending loan application', async () => {
    // First create a loan application
    const loanData = testLoan();
    loanData.status = 'submitted'; // Pending status
    const createResponse = await request(app)
      .post('/api/loans/apply')
      .send(loanData)
      .expect(201);

    const loanId = createResponse.body.data.id;

    const response = await request(app)
      .delete(`/api/loans/${loanId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('cancelled');
    expect(response.body.data.status).toBe('cancelled');
  });
});