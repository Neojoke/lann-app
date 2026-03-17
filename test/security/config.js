// Security test configuration for OWASP ZAP and other tools
const securityConfig = {
  // OWASP ZAP Configuration
  zap: {
    apiUrl: 'http://localhost:8080',  // Default ZAP proxy address
    target: 'http://localhost:3000', // Target application
    contextName: 'Lann-Thailand-Loan-App',
    contextUrls: [
      'http://localhost:3000/api/*',
      'http://localhost:3000/auth/*',
      'http://localhost:3000/users/*',
      'http://localhost:3000/loans/*',
      'http://localhost:3000/credits/*',
      'http://localhost:3000/repayments/*'
    ],
    excludeUrls: [
      'http://localhost:3000/assets/*',
      'http://localhost:3000/static/*',
      'http://localhost:3000/public/*'
    ],
    scanners: {
      enabled: [
        'active',    // Active scanner
        'passive',   // Passive scanner
        'spider',    // Spider crawler
        'ajaxSpider' // AJAX spider
      ],
      policy: {
        'alertThreshold': 'Low',  // Low, Medium, High, Informational
        'attackStrength': 'Medium' // Low, Medium, High, Insane
      }
    },
    authentication: {
      type: 'form_based',
      parameters: {
        'username': 'email',
        'password': 'password',
        'loginUrl': 'http://localhost:3000/api/users/login',
        'loggedInRegex': '.*token.*',
        'loggedOutRegex': '.*login.*'
      },
      credentials: [
        {
          username: 'testuser1@example.com',
          password: 'SecurePassword1!'
        },
        {
          username: 'testuser2@example.com',
          password: 'SecurePassword2!'
        }
      ]
    }
  },

  // Security headers to verify
  securityHeaders: [
    'Strict-Transport-Security',
    'X-Frame-Options',
    'X-Content-Type-Options',
    'X-XSS-Protection',
    'Referrer-Policy',
    'Content-Security-Policy',
    'Permissions-Policy'
  ],

  // Vulnerability checks
  vulnerabilityChecks: {
    injection: {
      sqlInjection: true,
      nosqlInjection: true,
      commandInjection: true,
      xss: true,
      ssiInjection: true
    },
    auth: {
      brokenAuth: true,
      weakPasswordPolicy: true,
      sessionFixation: true,
      insecureDirectObjectReferences: true
    },
    sensitiveData: {
      hardcodedCredentials: true,
      sensitiveDataExposure: true,
      weakCrypto: true
    },
    access: {
      privilegeEscalation: true,
      forceBrowsing: true,
      corsMisconfiguration: true
    },
    deps: {
      vulnerableLibraries: true,
      outdatedDependencies: true
    }
  },

  // API-specific security tests
  apiSecurityTests: {
    rateLimiting: {
      endpoint: '/api/users/login',
      method: 'POST',
      payload: {
        email: 'test@example.com',
        password: 'wrongpassword'
      },
      expectedBehavior: '429 after multiple requests',
      maxRequests: 10,
      timeWindow: 60 // seconds
    },
    authBypass: [
      {
        endpoint: '/api/loans/user/{userId}',
        method: 'GET',
        test: 'try to access other user\'s data',
        expected: '403 Forbidden'
      },
      {
        endpoint: '/api/admin/users',
        method: 'GET',
        test: 'try to access admin endpoints as regular user',
        expected: '403 Forbidden'
      }
    ],
    inputValidation: [
      {
        endpoint: '/api/users/register',
        method: 'POST',
        payloads: [
          {
            email: '<script>alert("xss")</script>',
            test: 'XSS in email field'
          },
          {
            password: '" OR 1=1 --',
            test: 'SQL injection in password'
          },
          {
            phone: '../../../../etc/passwd',
            test: 'Path traversal in phone field'
          }
        ]
      }
    ]
  },

  // Penetration testing scenarios
  penetrationTests: [
    {
      name: 'Authentication Bypass',
      description: 'Attempt to access protected resources without authentication',
      endpoints: [
        '/api/users/profile',
        '/api/loans/user/{userId}',
        '/api/credits/user/{userId}',
        '/api/admin/dashboard'
      ],
      expected: '401 Unauthorized'
    },
    {
      name: 'Authorization Bypass',
      description: 'Attempt to access other users\' resources',
      endpoints: [
        '/api/users/{otherUserId}/profile',
        '/api/loans/user/{otherUserId}',
        '/api/credits/{otherCreditId}'
      ],
      expected: '403 Forbidden'
    },
    {
      name: 'Rate Limit Testing',
      description: 'Test rate limiting on authentication endpoints',
      endpoint: '/api/users/login',
      method: 'POST',
      requestCount: 100,
      timeLimit: 60, // seconds
      expected: '429 responses after threshold'
    },
    {
      name: 'Input Validation',
      description: 'Test for common injection vulnerabilities',
      endpoint: '/api/users/register',
      method: 'POST',
      payloads: [
        {
          payload: '{"email": "<script>alert(1)</script>", "password": "test"}',
          type: 'XSS'
        },
        {
          payload: '{"email": "test@test.com", "password": "\" OR 1=1 --"}',
          type: 'SQL Injection'
        }
      ]
    }
  ],

  // Security scanning schedule
  schedule: {
    daily: [
      'dependency-check',
      'authentication-test'
    ],
    weekly: [
      'full-zap-scan',
      'penetration-tests',
      'api-security-tests'
    ],
    monthly: [
      'comprehensive-security-audit'
    ]
  },

  // Reporting configuration
  reporting: {
    format: 'sarif', // SARIF format for integration with tools
    outputDir: './test/reports/security',
    includeDetails: true,
    failOnCritical: true,
    thresholds: {
      critical: 0,
      high: 1,
      medium: 5,
      low: 10
    }
  }
};

module.exports = securityConfig;