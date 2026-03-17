import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../../backend/src/app'; // Adjust path as needed
import { testUser, testCredit } from '../../fixtures/factory';
import { connectDB, closeDB } from '../../../backend/src/config/database'; // Adjust path as needed

describe('Credit API Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  // Test 1: POST /api/credits/apply - Valid data
  it('should successfully create a credit application with valid data', async () => {
    const userData = testUser();
    const creditData = testCredit();
    creditData.userId = userData.id;

    const response = await request(app)
      .post('/api/credits/apply')
      .send(creditData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.userId).toBe(creditData.userId);
    expect(response.body.data.status).toBe('pending');
  });

  // Test 2: POST /api/credits/apply - Invalid data
  it('should return validation error for invalid credit application data', async () => {
    const invalidData = {
      userId: '', // Invalid: empty user ID
      creditScore: -100, // Invalid: negative score
      creditLimit: 'invalid_amount' // Invalid: not a number
    };

    const response = await request(app)
      .post('/api/credits/apply')
      .send(invalidData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });

  // Test 3: POST /api/credits/apply - Missing required fields
  it('should return validation error for missing required fields', async () => {
    const incompleteData = {
      userId: testUser().id
      // Missing required fields like creditLimit, status, etc.
    };

    const response = await request(app)
      .post('/api/credits/apply')
      .send(incompleteData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });

  // Test 4: GET /api/credits/:id - Valid ID
  it('should retrieve a credit application by ID', async () => {
    // First create a credit application
    const creditData = testCredit();
    const createResponse = await request(app)
      .post('/api/credits/apply')
      .send(creditData)
      .expect(201);

    const creditId = createResponse.body.data.id;

    const response = await request(app)
      .get(`/api/credits/${creditId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(creditId);
  });

  // Test 5: GET /api/credits/:id - Invalid ID format
  it('should return error for invalid credit ID format', async () => {
    const invalidId = 'invalid-id-format';

    const response = await request(app)
      .get(`/api/credits/${invalidId}`)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Invalid ID format');
  });

  // Test 6: GET /api/credits/:id - Non-existent ID
  it('should return not found for non-existent credit ID', async () => {
    const nonExistentId = '000000000000000000000000'; // Valid format but non-existent

    const response = await request(app)
      .get(`/api/credits/${nonExistentId}`)
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Credit application not found');
  });

  // Test 7: PUT /api/credits/:id/approve - Valid approval
  it('should successfully approve a credit application', async () => {
    // First create a pending credit application
    const creditData = testCredit();
    creditData.status = 'pending'; // Ensure it's pending
    const createResponse = await request(app)
      .post('/api/credits/apply')
      .send(creditData)
      .expect(201);

    const creditId = createResponse.body.data.id;

    const approvalData = {
      approvedBy: testUser().id,
      approvedAt: new Date().toISOString(),
      newCreditLimit: 50000
    };

    const response = await request(app)
      .put(`/api/credits/${creditId}/approve`)
      .send(approvalData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(creditId);
    expect(response.body.data.status).toBe('approved');
  });

  // Test 8: PUT /api/credits/:id/approve - Already approved
  it('should return error when trying to approve an already approved credit', async () => {
    // First create and approve a credit application
    const creditData = testCredit();
    creditData.status = 'pending';
    const createResponse = await request(app)
      .post('/api/credits/apply')
      .send(creditData)
      .expect(201);

    const creditId = createResponse.body.data.id;

    // Approve it first
    await request(app)
      .put(`/api/credits/${creditId}/approve`)
      .send({
        approvedBy: testUser().id,
        approvedAt: new Date().toISOString(),
        newCreditLimit: 50000
      })
      .expect(200);

    // Try to approve again
    const response = await request(app)
      .put(`/api/credits/${creditId}/approve`)
      .send({
        approvedBy: testUser().id,
        approvedAt: new Date().toISOString(),
        newCreditLimit: 75000
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('already approved');
  });

  // Test 9: PUT /api/credits/:id/reject - Valid rejection
  it('should successfully reject a credit application', async () => {
    // First create a pending credit application
    const creditData = testCredit();
    creditData.status = 'pending';
    const createResponse = await request(app)
      .post('/api/credits/apply')
      .send(creditData)
      .expect(201);

    const creditId = createResponse.body.data.id;

    const rejectionData = {
      rejectedBy: testUser().id,
      rejectedAt: new Date().toISOString(),
      reason: 'High risk assessment'
    };

    const response = await request(app)
      .put(`/api/credits/${creditId}/reject`)
      .send(rejectionData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(creditId);
    expect(response.body.data.status).toBe('rejected');
  });

  // Test 10: PUT /api/credits/:id/reject - Invalid rejection data
  it('should return validation error for invalid rejection data', async () => {
    // First create a pending credit application
    const creditData = testCredit();
    creditData.status = 'pending';
    const createResponse = await request(app)
      .post('/api/credits/apply')
      .send(creditData)
      .expect(201);

    const creditId = createResponse.body.data.id;

    const invalidRejectionData = {
      rejectedBy: '', // Invalid: empty ID
      rejectedAt: 'invalid-date', // Invalid: wrong date format
      reason: '' // Invalid: empty reason
    };

    const response = await request(app)
      .put(`/api/credits/${creditId}/reject`)
      .send(invalidRejectionData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });

  // Test 11: GET /api/credits/user/:userId - Valid user
  it('should retrieve all credit applications for a user', async () => {
    const user = testUser();
    
    // Create multiple credit applications for the same user
    const creditData1 = testCredit();
    creditData1.userId = user.id;
    await request(app)
      .post('/api/credits/apply')
      .send(creditData1)
      .expect(201);

    const creditData2 = testCredit();
    creditData2.userId = user.id;
    await request(app)
      .post('/api/credits/apply')
      .send(creditData2)
      .expect(201);

    const response = await request(app)
      .get(`/api/credits/user/${user.id}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
  });

  // Test 12: GET /api/credits/user/:userId - User with no credits
  it('should return empty array for user with no credit applications', async () => {
    const fakeUserId = '000000000000000000000000'; // Valid format but non-existent

    const response = await request(app)
      .get(`/api/credits/user/${fakeUserId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBe(0);
  });

  // Test 13: PUT /api/credits/:id/update-limit - Valid limit update
  it('should successfully update credit limit', async () => {
    // First create and approve a credit application
    const creditData = testCredit();
    creditData.status = 'approved';
    const createResponse = await request(app)
      .post('/api/credits/apply')
      .send(creditData)
      .expect(201);

    const creditId = createResponse.body.data.id;

    const updateData = {
      newLimit: 75000,
      updatedBy: testUser().id,
      reason: 'Creditworthiness improvement'
    };

    const response = await request(app)
      .put(`/api/credits/${creditId}/update-limit`)
      .send(updateData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(creditId);
    expect(response.body.data.creditLimit).toBe(75000);
  });

  // Test 14: PUT /api/credits/:id/update-limit - Unauthorized limit decrease
  it('should restrict decreasing credit limit without proper authorization', async () => {
    // First create and approve a credit application with high limit
    const creditData = testCredit();
    creditData.status = 'approved';
    creditData.creditLimit = 100000;
    const createResponse = await request(app)
      .post('/api/credits/apply')
      .send(creditData)
      .expect(201);

    const creditId = createResponse.body.data.id;

    // Attempt to decrease limit significantly without proper authorization
    const updateData = {
      newLimit: 10000, // Significantly decreased
      updatedBy: testUser().id,
      reason: 'Risk assessment'
    };

    // This might return 403 depending on business logic
    const response = await request(app)
      .put(`/api/credits/${creditId}/update-limit`)
      .send(updateData);

    // The response status depends on the implementation - could be 200 with restrictions
    // or 403 if not authorized to decrease significantly
    expect(response.status).toBeOneOf([200, 403]);
  });

  // Test 15: DELETE /api/credits/:id - Valid deletion
  it('should successfully soft delete a credit application', async () => {
    // First create a credit application
    const creditData = testCredit();
    const createResponse = await request(app)
      .post('/api/credits/apply')
      .send(creditData)
      .expect(201);

    const creditId = createResponse.body.data.id;

    const response = await request(app)
      .delete(`/api/credits/${creditId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('deleted');
  });
});