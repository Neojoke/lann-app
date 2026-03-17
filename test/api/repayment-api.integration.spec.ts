import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../../backend/src/app'; // Adjust path as needed
import { testUser, testLoan, testRepayment } from '../../fixtures/factory';
import { connectDB, closeDB } from '../../../backend/src/config/database'; // Adjust path as needed

describe('Repayment API Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  // Test 1: POST /api/repayments/make - Valid repayment
  it('should successfully create a repayment record with valid data', async () => {
    // First create a loan that requires repayment
    const loanData = testLoan();
    loanData.status = 'disbursed'; // Ensure loan is active
    const createLoanResponse = await request(app)
      .post('/api/loans/apply')
      .send(loanData)
      .expect(201);

    const loanId = createLoanResponse.body.data.id;

    // Now make a repayment
    const repaymentData = testRepayment();
    repaymentData.loanId = loanId;
    repaymentData.userId = loanData.userId;
    repaymentData.status = 'pending'; // Initial status

    const response = await request(app)
      .post('/api/repayments/make')
      .send(repaymentData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.loanId).toBe(loanId);
    expect(response.body.data.status).toBe('pending');
  });

  // Test 2: POST /api/repayments/make - Invalid repayment data
  it('should return validation error for invalid repayment data', async () => {
    const invalidData = {
      loanId: '', // Invalid: empty loan ID
      amount: -1000, // Invalid: negative amount
      paymentMethod: 'invalid_method', // Invalid: unsupported method
      referenceNumber: '' // Invalid: empty reference
    };

    const response = await request(app)
      .post('/api/repayments/make')
      .send(invalidData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });

  // Test 3: POST /api/repayments/make - Missing required fields
  it('should return validation error for missing required fields', async () => {
    const incompleteData = {
      loanId: testLoan().id
      // Missing required fields like amount, userId, etc.
    };

    const response = await request(app)
      .post('/api/repayments/make')
      .send(incompleteData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });

  // Test 4: GET /api/repayments/:id - Valid repayment ID
  it('should retrieve a repayment record by ID', async () => {
    // First create a repayment
    const repaymentData = testRepayment();
    const createResponse = await request(app)
      .post('/api/repayments/make')
      .send(repaymentData)
      .expect(201);

    const repaymentId = createResponse.body.data.id;

    const response = await request(app)
      .get(`/api/repayments/${repaymentId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(repaymentId);
  });

  // Test 5: GET /api/repayments/:id - Invalid ID format
  it('should return error for invalid repayment ID format', async () => {
    const invalidId = 'invalid-id-format';

    const response = await request(app)
      .get(`/api/repayments/${invalidId}`)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Invalid ID format');
  });

  // Test 6: GET /api/repayments/:id - Non-existent ID
  it('should return not found for non-existent repayment ID', async () => {
    const nonExistentId = '000000000000000000000000'; // Valid format but non-existent

    const response = await request(app)
      .get(`/api/repayments/${nonExistentId}`)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Repayment not found');
  });

  // Test 7: PUT /api/repayments/:id/process - Valid repayment processing
  it('should successfully process a repayment', async () => {
    // First create a repayment in pending status
    const repaymentData = testRepayment();
    repaymentData.status = 'pending';
    const createResponse = await request(app)
      .post('/api/repayments/make')
      .send(repaymentData)
      .expect(201);

    const repaymentId = createResponse.body.data.id;

    const processData = {
      processedBy: testUser().id,
      processedAt: new Date().toISOString(),
      transactionStatus: 'successful',
      confirmationNumber: 'CONFIRM' + Date.now()
    };

    const response = await request(app)
      .put(`/api/repayments/${repaymentId}/process`)
      .send(processData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(repaymentId);
    expect(response.body.data.status).toBe('paid');
  });

  // Test 8: PUT /api/repayments/:id/process - Already processed repayment
  it('should return error when trying to process an already processed repayment', async () => {
    // First create and process a repayment
    const repaymentData = testRepayment();
    repaymentData.status = 'pending';
    const createResponse = await request(app)
      .post('/api/repayments/make')
      .send(repaymentData)
      .expect(201);

    const repaymentId = createResponse.body.data.id;

    // Process it first
    await request(app)
      .put(`/api/repayments/${repaymentId}/process`)
      .send({
        processedBy: testUser().id,
        processedAt: new Date().toISOString(),
        transactionStatus: 'successful',
        confirmationNumber: 'CONFIRM' + Date.now()
      })
      .expect(200);

    // Try to process again
    const response = await request(app)
      .put(`/api/repayments/${repaymentId}/process`)
      .send({
        processedBy: testUser().id,
        processedAt: new Date().toISOString(),
        transactionStatus: 'successful',
        confirmationNumber: 'CONFIRM' + (Date.now() + 1)
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('already processed');
  });

  // Test 9: PUT /api/repayments/:id/cancel - Valid cancellation
  it('should successfully cancel a pending repayment', async () => {
    // First create a repayment in pending status
    const repaymentData = testRepayment();
    repaymentData.status = 'pending';
    const createResponse = await request(app)
      .post('/api/repayments/make')
      .send(repaymentData)
      .expect(201);

    const repaymentId = createResponse.body.data.id;

    const cancelData = {
      cancelledBy: testUser().id,
      cancelledAt: new Date().toISOString(),
      reason: 'Payment method issue'
    };

    const response = await request(app)
      .put(`/api/repayments/${repaymentId}/cancel`)
      .send(cancelData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(repaymentId);
    expect(response.body.data.status).toBe('cancelled');
  });

  // Test 10: PUT /api/repayments/:id/cancel - Attempt to cancel processed repayment
  it('should return error when trying to cancel a processed repayment', async () => {
    // First create and process a repayment
    const repaymentData = testRepayment();
    repaymentData.status = 'pending';
    const createResponse = await request(app)
      .post('/api/repayments/make')
      .send(repaymentData)
      .expect(201);

    const repaymentId = createResponse.body.data.id;

    // Process it
    await request(app)
      .put(`/api/repayments/${repaymentId}/process`)
      .send({
        processedBy: testUser().id,
        processedAt: new Date().toISOString(),
        transactionStatus: 'successful',
        confirmationNumber: 'CONFIRM' + Date.now()
      })
      .expect(200);

    // Try to cancel it
    const cancelData = {
      cancelledBy: testUser().id,
      cancelledAt: new Date().toISOString(),
      reason: 'User request'
    };

    const response = await request(app)
      .put(`/api/repayments/${repaymentId}/cancel`)
      .send(cancelData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('cannot be cancelled');
  });

  // Test 11: GET /api/repayments/loan/:loanId - Valid loan ID
  it('should retrieve all repayments for a loan', async () => {
    // First create a loan
    const loanData = testLoan();
    const createLoanResponse = await request(app)
      .post('/api/loans/apply')
      .send(loanData)
      .expect(201);

    const loanId = createLoanResponse.body.data.id;

    // Create multiple repayments for the same loan
    const repaymentData1 = testRepayment();
    repaymentData1.loanId = loanId;
    await request(app)
      .post('/api/repayments/make')
      .send(repaymentData1)
      .expect(201);

    const repaymentData2 = testRepayment();
    repaymentData2.loanId = loanId;
    await request(app)
      .post('/api/repayments/make')
      .send(repaymentData2)
      .expect(201);

    const response = await request(app)
      .get(`/api/repayments/loan/${loanId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
  });

  // Test 12: GET /api/repayments/loan/:loanId - Loan with no repayments
  it('should return empty array for loan with no repayments', async () => {
    // Create a loan first
    const loanData = testLoan();
    const createLoanResponse = await request(app)
      .post('/api/loans/apply')
      .send(loanData)
      .expect(201);

    const loanId = createLoanResponse.body.data.id;

    const response = await request(app)
      .get(`/api/repayments/loan/${loanId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(0);
  });

  // Test 13: PUT /api/repayments/:id/mark-overdue - Mark repayment as overdue
  it('should successfully mark a repayment as overdue', async () => {
    // First create a repayment with past due date
    const repaymentData = testRepayment();
    repaymentData.dueDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday
    repaymentData.status = 'pending';
    const createResponse = await request(app)
      .post('/api/repayments/make')
      .send(repaymentData)
      .expect(201);

    const repaymentId = createResponse.body.data.id;

    const overdueData = {
      markedBy: testUser().id,
      markedAt: new Date().toISOString()
    };

    const response = await request(app)
      .put(`/api/repayments/${repaymentId}/mark-overdue`)
      .send(overdueData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(repaymentId);
    expect(response.body.data.status).toBe('overdue');
  });

  // Test 14: PUT /api/repayments/:id/waive - Waive a repayment penalty
  it('should successfully waive a repayment', async () => {
    // First create a repayment
    const repaymentData = testRepayment();
    repaymentData.status = 'pending';
    const createResponse = await request(app)
      .post('/api/repayments/make')
      .send(repaymentData)
      .expect(201);

    const repaymentId = createResponse.body.data.id;

    const waiveData = {
      waivedBy: testUser().id,
      waivedAt: new Date().toISOString(),
      reason: 'Good customer discount'
    };

    const response = await request(app)
      .put(`/api/repayments/${repaymentId}/waive`)
      .send(waiveData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(repaymentId);
    expect(response.body.data.status).toBe('waived');
  });

  // Test 15: GET /api/repayments/user/:userId - Valid user ID
  it('should retrieve all repayments for a user', async () => {
    const user = testUser();

    // Create a loan for the user
    const loanData = testLoan();
    loanData.userId = user.id;
    const createLoanResponse = await request(app)
      .post('/api/loans/apply')
      .send(loanData)
      .expect(201);

    const loanId = createLoanResponse.body.data.id;

    // Create multiple repayments for the user's loan
    const repaymentData1 = testRepayment();
    repaymentData1.loanId = loanId;
    repaymentData1.userId = user.id;
    await request(app)
      .post('/api/repayments/make')
      .send(repaymentData1)
      .expect(201);

    const repaymentData2 = testRepayment();
    repaymentData2.loanId = loanId;
    repaymentData2.userId = user.id;
    await request(app)
      .post('/api/repayments/make')
      .send(repaymentData2)
      .expect(201);

    const response = await request(app)
      .get(`/api/repayments/user/${user.id}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
  });
});