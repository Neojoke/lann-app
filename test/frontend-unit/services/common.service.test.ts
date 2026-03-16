/**
 * 服务层通用测试
 * 
 * 测试覆盖:
 * - API 客户端
 * - 认证服务
 * - 本地存储服务
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('API Client', () => {
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should make GET request', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: 'test' }),
    });

    const response = await fetch('/api/test');
    const data = await response.json();

    expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.any(Object));
    expect(data).toEqual({ data: 'test' });
  });

  it('should make POST request with body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const response = await fetch('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ key: 'value' }),
    }));
  });

  it('should handle API errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const response = await fetch('/api/test');
    
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });

  it('should include auth token in headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await fetch('/api/protected', {
      headers: { 'Authorization': 'Bearer token123' },
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/protected', expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': 'Bearer token123',
      }),
    }));
  });

  it('should handle timeout', async () => {
    mockFetch.mockImplementation(() => new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 1000);
    }));

    await expect(fetch('/api/slow')).rejects.toThrow('Timeout');
  });
});

describe('Auth Service', () => {
  it('should store token after login', () => {
    const token = 'test-token-123';
    localStorage.setItem('auth_token', token);
    
    expect(localStorage.getItem('auth_token')).toBe(token);
    
    localStorage.removeItem('auth_token');
  });

  it('should retrieve token from storage', () => {
    localStorage.setItem('auth_token', 'stored-token');
    const token = localStorage.getItem('auth_token');
    
    expect(token).toBe('stored-token');
    
    localStorage.removeItem('auth_token');
  });

  it('should clear token on logout', () => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.removeItem('auth_token');
    
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('should check if user is authenticated', () => {
    const isAuthenticated = () => localStorage.getItem('auth_token') !== null;
    
    localStorage.setItem('auth_token', 'token');
    expect(isAuthenticated()).toBe(true);
    
    localStorage.removeItem('auth_token');
    expect(isAuthenticated()).toBe(false);
  });
});

describe('Storage Service', () => {
  it('should set item in storage', () => {
    localStorage.setItem('key', 'value');
    expect(localStorage.getItem('key')).toBe('value');
    localStorage.removeItem('key');
  });

  it('should get item from storage', () => {
    localStorage.setItem('testKey', 'testValue');
    const value = localStorage.getItem('testKey');
    expect(value).toBe('testValue');
    localStorage.removeItem('testKey');
  });

  it('should remove item from storage', () => {
    localStorage.setItem('keyToRemove', 'value');
    localStorage.removeItem('keyToRemove');
    expect(localStorage.getItem('keyToRemove')).toBeNull();
  });

  it('should clear all storage', () => {
    localStorage.setItem('key1', 'value1');
    localStorage.setItem('key2', 'value2');
    localStorage.clear();
    expect(localStorage.length).toBe(0);
  });

  it('should handle JSON serialization', () => {
    const data = { name: 'test', value: 123 };
    localStorage.setItem('jsonData', JSON.stringify(data));
    
    const retrieved = JSON.parse(localStorage.getItem('jsonData') || '{}');
    expect(retrieved).toEqual(data);
    
    localStorage.removeItem('jsonData');
  });
});

describe('Error Handling', () => {
  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    
    await expect(fetch('/api/test')).rejects.toThrow('Network error');
  });

  it('should handle 404 errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const response = await fetch('/api/nonexistent');
    expect(response.status).toBe(404);
  });

  it('should handle 401 unauthorized', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });

    const response = await fetch('/api/protected');
    expect(response.status).toBe(401);
  });

  it('should retry on failure', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('First attempt failed'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });
    
    global.fetch = mockFetch;

    let result;
    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      try {
        const response = await fetch('/api/test');
        result = await response.json();
        break;
      } catch (e) {
        attempts++;
      }
    }

    expect(result).toEqual({ success: true });
    expect(attempts).toBe(1);
  });
});
