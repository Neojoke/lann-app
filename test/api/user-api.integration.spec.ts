import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../../../backend/src/app'; // Adjust path as needed
import { testUser } from '../../fixtures/factory';
import { connectDB, closeDB } from '../../../backend/src/config/database'; // Adjust path as needed

describe('User API Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  // Test 1: POST /api/users/register - Valid registration
  it('should successfully register a new user with valid data', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    const response = await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.email).toBe(userData.email);
    expect(response.body.data.username).toBe(userData.username);
    expect(response.body.data.isActive).toBe(true);
  });

  // Test 2: POST /api/users/register - Invalid registration data
  it('should return validation error for invalid registration data', async () => {
    const invalidUserData = {
      username: '', // Invalid: empty username
      email: 'invalid-email', // Invalid: not an email
      password: '123', // Invalid: too short
      firstName: '', // Invalid: empty first name
      phone: 'invalid-phone' // Invalid: not a phone number
    };

    const response = await request(app)
      .post('/api/users/register')
      .send(invalidUserData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });

  // Test 3: POST /api/users/register - Duplicate email
  it('should return error for duplicate email registration', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register the user first
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    // Try to register again with the same email
    const response = await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(409);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('already exists');
  });

  // Test 4: POST /api/users/login - Valid login
  it('should successfully authenticate user with valid credentials', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register the user first
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const response = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(userData.email);
  });

  // Test 5: POST /api/users/login - Invalid credentials
  it('should return error for invalid login credentials', async () => {
    const loginData = {
      email: 'nonexistent@example.com',
      password: 'WrongPassword123!'
    };

    const response = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Invalid credentials');
  });

  // Test 6: POST /api/users/login - Missing credentials
  it('should return validation error for missing login credentials', async () => {
    const incompleteLoginData = {
      email: 'test@example.com'
      // Missing password
    };

    const response = await request(app)
      .post('/api/users/login')
      .send(incompleteLoginData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });

  // Test 7: GET /api/users/profile - Get user profile
  it('should retrieve authenticated user profile', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register and login the user
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(registerResponse.body.data.id);
    expect(response.body.data.email).toBe(userData.email);
  });

  // Test 8: GET /api/users/profile - Unauthenticated request
  it('should return unauthorized for unauthenticated profile request', async () => {
    const response = await request(app)
      .get('/api/users/profile')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Unauthorized');
  });

  // Test 9: PUT /api/users/profile - Update user profile
  it('should update user profile successfully', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register and login the user
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
      phone: '+66812345678',
      address: {
        street: '123 Updated Street',
        city: 'Bangkok',
        province: 'Bangkok',
        postalCode: '10110',
        country: 'Thailand'
      }
    };

    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(updateData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.firstName).toBe('Updated');
    expect(response.body.data.lastName).toBe('Name');
    expect(response.body.data.phone).toBe('+66812345678');
  });

  // Test 10: PUT /api/users/profile - Update with invalid data
  it('should return validation error for invalid profile update data', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register and login the user
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    const invalidUpdateData = {
      email: 'invalid-email', // Invalid email format
      phone: 'short', // Invalid phone format
      dateOfBirth: 'invalid-date' // Invalid date format
    };

    const response = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(invalidUpdateData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
  });

  // Test 11: POST /api/users/logout - User logout
  it('should successfully log out user', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register and login the user
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    const response = await request(app)
      .post('/api/users/logout')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('logged out');
  });

  // Test 12: POST /api/users/logout - Logout with invalid token
  it('should handle logout with invalid token gracefully', async () => {
    const response = await request(app)
      .post('/api/users/logout')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    // Even with invalid token, the logout should succeed conceptually
    expect(response.body.success).toBe(true); // Or could be false depending on implementation
  });

  // Test 13: POST /api/users/forgot-password - Forgot password request
  it('should accept forgot password request for existing user', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register the user first
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const forgotData = {
      email: userData.email
    };

    const response = await request(app)
      .post('/api/users/forgot-password')
      .send(forgotData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Password reset link sent');
  });

  // Test 14: POST /api/users/forgot-password - Forgot password for non-existent user
  it('should handle forgot password request for non-existent user', async () => {
    const forgotData = {
      email: 'nonexistent@example.com'
    };

    const response = await request(app)
      .post('/api/users/forgot-password')
      .send(forgotData)
      .expect(200); // Return 200 to avoid exposing user existence

    expect(response.body.success).toBe(true);
    // Should return the same response regardless of user existence to prevent enumeration
  });

  // Test 15: POST /api/users/reset-password - Password reset
  it('should successfully reset user password', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register the user first
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    // Simulate getting a reset token (in real app this would come from email)
    // For this test, we'll assume we have a valid token
    const resetData = {
      token: 'valid-reset-token', // This would normally be a JWT or similar
      newPassword: 'NewSecurePassword456!'
    };

    // Note: This test assumes a password reset endpoint exists
    // The implementation would vary based on how reset tokens are handled
    const response = await request(app)
      .post('/api/users/reset-password')
      .send(resetData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Password reset successfully');
  });

  // Test 16: GET /api/users/preferences - Get user preferences
  it('should retrieve user preferences', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register and login the user
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    const response = await request(app)
      .get('/api/users/preferences')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('language');
    expect(response.body.data).toHaveProperty('notifications');
    expect(response.body.data).toHaveProperty('theme');
  });

  // Test 17: PUT /api/users/preferences - Update user preferences
  it('should update user preferences', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register and login the user
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    const preferencesData = {
      language: 'th',
      notifications: {
        email: true,
        sms: false,
        push: true
      },
      theme: 'dark',
      currency: 'THB'
    };

    const response = await request(app)
      .put('/api/users/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send(preferencesData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.language).toBe('th');
    expect(response.body.data.theme).toBe('dark');
  });

  // Test 18: POST /api/users/change-password - Change password
  it('should successfully change user password', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register and login the user
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    const changePasswordData = {
      currentPassword: 'SecurePassword123!',
      newPassword: 'NewSecurePassword456!'
    };

    const response = await request(app)
      .post('/api/users/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send(changePasswordData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Password changed successfully');
  });

  // Test 19: POST /api/users/change-password - Wrong current password
  it('should return error for wrong current password', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register and login the user
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    const changePasswordData = {
      currentPassword: 'WrongPassword123!', // Wrong current password
      newPassword: 'NewSecurePassword456!'
    };

    const response = await request(app)
      .post('/api/users/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send(changePasswordData)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Current password is incorrect');
  });

  // Test 20: GET /api/users/activity - Get user activity history
  it('should retrieve user activity history', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register and login the user
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    const response = await request(app)
      .get('/api/users/activity')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.pagination).toBeDefined();
  });

  // Test 21: POST /api/users/devices/register - Register device for notifications
  it('should register a device for push notifications', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register and login the user
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    const deviceData = {
      deviceId: 'device-' + Date.now(),
      deviceType: 'mobile',
      deviceToken: 'push-notification-token-' + Date.now(),
      platform: 'ios'
    };

    const response = await request(app)
      .post('/api/users/devices/register')
      .set('Authorization', `Bearer ${token}`)
      .send(deviceData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.deviceId).toBe(deviceData.deviceId);
    expect(response.body.message).toContain('Device registered');
  });

  // Test 22: DELETE /api/users/devices/:deviceId - Remove device registration
  it('should remove a device registration', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register and login the user
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    // First register a device
    const deviceData = {
      deviceId: 'device-' + Date.now(),
      deviceType: 'mobile',
      deviceToken: 'push-notification-token-' + Date.now(),
      platform: 'android'
    };

    await request(app)
      .post('/api/users/devices/register')
      .set('Authorization', `Bearer ${token}`)
      .send(deviceData)
      .expect(200);

    // Now remove the device
    const response = await request(app)
      .delete(`/api/users/devices/${deviceData.deviceId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Device removed');
  });

  // Test 23: POST /api/users/verify-email - Request email verification
  it('should send email verification request', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register the user first
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const verificationData = {
      email: userData.email
    };

    const response = await request(app)
      .post('/api/users/verify-email')
      .send(verificationData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Verification email sent');
  });

  // Test 24: POST /api/users/verify-phone - Request phone verification
  it('should send phone verification request', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    userData.phone = '+66812345678';
    
    // Register the user first
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    const response = await request(app)
      .post('/api/users/verify-phone')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Verification code sent');
  });

  // Test 25: POST /api/users/verify-code - Verify email/phone code
  it('should verify email or phone verification code', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    userData.phone = '+66812345678';
    
    // Register and login the user
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    const verificationData = {
      verificationType: 'phone', // or 'email'
      code: '123456', // In real app, this would be a valid code
      phoneNumber: userData.phone
    };

    const response = await request(app)
      .post('/api/users/verify-code')
      .set('Authorization', `Bearer ${token}`)
      .send(verificationData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('verified');
  });

  // Test 26: GET /api/users/security-settings - Get security settings
  it('should retrieve user security settings', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register and login the user
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    const response = await request(app)
      .get('/api/users/security-settings')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('twoFactorEnabled');
    expect(response.body.data).toHaveProperty('loginHistory');
    expect(response.body.data).toHaveProperty('trustedDevices');
  });

  // Test 27: PUT /api/users/security-settings - Update security settings
  it('should update user security settings', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register and login the user
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    const securitySettings = {
      twoFactorEnabled: true,
      requireTwoFactorForTransactions: true,
      trustedDevices: [],
      loginNotification: true
    };

    const response = await request(app)
      .put('/api/users/security-settings')
      .set('Authorization', `Bearer ${token}`)
      .send(securitySettings)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.twoFactorEnabled).toBe(true);
  });

  // Test 28: POST /api/users/consent - Manage user consent
  it('should manage user consent preferences', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register and login the user
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    const consentData = {
      marketingConsent: true,
      analyticsConsent: true,
      thirdPartySharingConsent: false,
      consentVersion: '1.0'
    };

    const response = await request(app)
      .post('/api/users/consent')
      .set('Authorization', `Bearer ${token}`)
      .send(consentData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.marketingConsent).toBe(true);
    expect(response.body.data.thirdPartySharingConsent).toBe(false);
  });

  // Test 29: GET /api/users/statistics - Get user statistics
  it('should retrieve user statistics', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register and login the user
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    const response = await request(app)
      .get('/api/users/statistics')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('totalLoans');
    expect(response.body.data).toHaveProperty('totalRepayments');
    expect(response.body.data).toHaveProperty('creditScore');
    expect(response.body.data).toHaveProperty('accountAge');
  });

  // Test 30: POST /api/users/support-ticket - Create support ticket
  it('should create a support ticket', async () => {
    const userData = testUser();
    userData.password = 'SecurePassword123!';
    
    // Register and login the user
    await request(app)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    const loginData = {
      email: userData.email,
      password: userData.password
    };

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    const token = loginResponse.body.token;

    const ticketData = {
      subject: 'Account Issue',
      category: 'technical',
      priority: 'medium',
      description: 'I am having trouble accessing my account',
      attachments: [] // Optional
    };

    const response = await request(app)
      .post('/api/users/support-ticket')
      .set('Authorization', `Bearer ${token}`)
      .send(ticketData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.subject).toBe('Account Issue');
    expect(response.body.data.status).toBe('open');
  });
});