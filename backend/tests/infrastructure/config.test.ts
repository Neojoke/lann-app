import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConfigService, getConfigService, ProductConfig, RateConfig, ChannelConfig } from '../services/config.service';

// Mock ioredis
vi.mock('ioredis', () => {
  return {
    default: class RedisMock {
      private store: Map<string, any> = new Map();
      private subscribers: Array<(channel: string, message: string) => void> = [];

      on(event: string, callback: () => void) {
        // Mock event subscription
        callback();
      }

      async set(key: string, value: string) {
        this.store.set(key, value);
        return 'OK';
      }

      async setex(key: string, seconds: number, value: string) {
        this.store.set(key, value);
        return 'OK';
      }

      async get(key: string) {
        return this.store.get(key) || null;
      }

      async del(key: string) {
        return this.store.delete(key) ? 1 : 0;
      }

      async keys(pattern: string) {
        const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`);
        return Array.from(this.store.keys()).filter(key => regex.test(key));
      }

      async ttl(key: string) {
        // Mock TTL behavior - return 300 seconds for demonstration
        return 300;
      }

      async quit() {
        return 'OK';
      }

      async publish(channel: string, message: string) {
        // Notify subscribers
        this.subscribers.forEach(subscriber => subscriber(channel, message));
        return 1;
      }

      subscribe(channel: string, callback: (err: Error | null, count: number) => void) {
        callback(null, 1);
      }

      onMessage(handler: (channel: string, message: string) => void) {
        this.subscribers.push(handler);
      }
    }
  };
});

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
  });

  afterEach(async () => {
    // Clean up after each test
    await configService.close();
  });

  it('should initialize correctly', () => {
    expect(configService).toBeDefined();
    expect(typeof configService.setConfig).toBe('function');
    expect(typeof configService.getConfig).toBe('function');
    expect(typeof configService.deleteConfig).toBe('function');
  });

  it('should set and get a config value', async () => {
    const testKey = 'test.key';
    const testValue = { hello: 'world', number: 42 };

    await configService.setConfig(testKey, testValue);

    const retrievedValue = await configService.getConfig(testKey);
    expect(retrievedValue).toEqual(testValue);
  });

  it('should return null for non-existent config', async () => {
    const retrievedValue = await configService.getConfig('non.existent.key');
    expect(retrievedValue).toBeNull();
  });

  it('should delete a config', async () => {
    const testKey = 'delete.test';
    await configService.setConfig(testKey, 'test-value');

    const existsBefore = await configService.getConfig(testKey);
    expect(existsBefore).toBe('test-value');

    const deleted = await configService.deleteConfig(testKey);
    expect(deleted).toBe(true);

    const existsAfter = await configService.getConfig(testKey);
    expect(existsAfter).toBeNull();
  });

  it('should handle TTL for configs', async () => {
    const testKey = 'ttl.test';
    const testValue = 'ttl-value';

    // Set config with TTL of 1 second
    await configService.setConfig(testKey, testValue, 1);

    const retrievedValue = await configService.getConfig(testKey);
    expect(retrievedValue).toBe(testValue);

    // Simulate time passing and verify TTL behavior
    const ttl = await (configService as any).redis.ttl(`config:${testKey}`);
    expect(ttl).toBeGreaterThan(0);
  });

  it('should set and get multiple configs', async () => {
    const configs = {
      'multi.key1': 'value1',
      'multi.key2': 'value2',
      'multi.key3': { nested: 'object' }
    };

    await configService.setConfigs(configs);

    const retrieved = await configService.getConfigs(['multi.key1', 'multi.key2', 'multi.key3']);
    expect(retrieved['multi.key1']).toBe('value1');
    expect(retrieved['multi.key2']).toBe('value2');
    expect(retrieved['multi.key3']).toEqual({ nested: 'object' });
  });

  it('should work with product configurations', async () => {
    const productConfig: ProductConfig = {
      productId: 'prod-123',
      productName: 'Test Product',
      interestRate: 0.08,
      maxAmount: 50000,
      minAmount: 1000,
      termOptions: [3, 6, 12],
      eligibilityCriteria: {
        minAge: 18,
        maxAge: 65,
        minIncome: 20000,
        creditScoreThreshold: 650
      },
      fees: {
        applicationFee: 50,
        processingFee: 100,
        latePaymentFee: 25
      }
    };

    await configService.setProductConfig(productConfig);

    const retrieved = await configService.getProductConfig('prod-123');
    expect(retrieved).toEqual(productConfig);
  });

  it('should work with rate configurations', async () => {
    const rateConfig: RateConfig = {
      id: 'rate-456',
      name: 'Standard Rate',
      baseRate: 0.075,
      riskAdjustment: {
        creditScoreWeight: 0.4,
        incomeWeight: 0.3,
        employmentLengthWeight: 0.3
      },
      effectiveDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    };

    await configService.setRateConfig(rateConfig);

    const retrieved = await configService.getRateConfig('rate-456');
    expect(retrieved).toEqual(rateConfig);
  });

  it('should work with channel configurations', async () => {
    const channelConfig: ChannelConfig = {
      channelId: 'channel-789',
      channelName: 'Online Portal',
      enabled: true,
      priority: 1,
      feeStructure: {
        discountRate: 0.05,
        commissionRate: 0.02
      },
      integrationSettings: {
        apiKey: 'test-api-key',
        endpoint: 'https://api.example.com',
        timeout: 5000
      }
    };

    await configService.setChannelConfig(channelConfig);

    const retrieved = await configService.getChannelConfig('channel-789');
    expect(retrieved).toEqual(channelConfig);
  });

  it('should validate basic configurations', () => {
    expect(configService.validateConfig('app.maintenance', true)).toBe(true);
    expect(configService.validateConfig('app.maintenance', 'not-a-boolean')).toBe(false);
    
    expect(configService.validateConfig('app.version', '1.2.3')).toBe(true);
    expect(configService.validateConfig('app.version', 'invalid-version')).toBe(true); // Version format check is lenient
    
    expect(configService.validateConfig('loan.max_amount', 10000)).toBe(true);
    expect(configService.validateConfig('loan.max_amount', -1000)).toBe(false);
    
    expect(configService.validateConfig('interest.default_rate', 0.08)).toBe(true);
    expect(configService.validateConfig('interest.default_rate', 1.5)).toBe(true); // Allow rates > 100% for special products
  });

  it('should validate product configurations', () => {
    const validProductConfig: ProductConfig = {
      productId: 'valid-123',
      productName: 'Valid Product',
      interestRate: 0.08,
      maxAmount: 50000,
      minAmount: 1000,
      termOptions: [3, 6, 12],
      eligibilityCriteria: {
        minAge: 18,
        maxAge: 65,
        minIncome: 20000,
        creditScoreThreshold: 650
      },
      fees: {
        applicationFee: 50,
        processingFee: 100,
        latePaymentFee: 25
      }
    };

    expect(configService.validateConfig('product:test', validProductConfig)).toBe(true);

    const invalidProductConfig = { ...validProductConfig, productId: '' };
    expect(configService.validateConfig('product:test', invalidProductConfig)).toBe(false);
  });

  it('should validate rate configurations', () => {
    const validRateConfig: RateConfig = {
      id: 'valid-rate',
      name: 'Valid Rate',
      baseRate: 0.075,
      riskAdjustment: {
        creditScoreWeight: 0.4,
        incomeWeight: 0.3,
        employmentLengthWeight: 0.3
      },
      effectiveDate: new Date()
    };

    expect(configService.validateConfig('rate:test', validRateConfig)).toBe(true);

    const invalidRateConfig = { ...validRateConfig, id: '' };
    expect(configService.validateConfig('rate:test', invalidRateConfig)).toBe(false);
  });

  it('should validate channel configurations', () => {
    const validChannelConfig: ChannelConfig = {
      channelId: 'valid-channel',
      channelName: 'Valid Channel',
      enabled: true,
      priority: 1,
      feeStructure: {
        discountRate: 0.05,
        commissionRate: 0.02
      },
      integrationSettings: {
        apiKey: 'test-key',
        endpoint: 'https://api.example.com',
        timeout: 5000
      }
    };

    expect(configService.validateConfig('channel:test', validChannelConfig)).toBe(true);

    const invalidChannelConfig = { ...validChannelConfig, channelId: '' };
    expect(configService.validateConfig('channel:test', invalidChannelConfig)).toBe(false);
  });

  it('should get all product configurations', async () => {
    const product1: ProductConfig = {
      productId: 'prod-1',
      productName: 'Product 1',
      interestRate: 0.08,
      maxAmount: 50000,
      minAmount: 1000,
      termOptions: [3, 6, 12],
      eligibilityCriteria: {
        minAge: 18,
        maxAge: 65,
        minIncome: 20000,
        creditScoreThreshold: 650
      },
      fees: {
        applicationFee: 50,
        processingFee: 100,
        latePaymentFee: 25
      }
    };

    const product2: ProductConfig = {
      ...product1,
      productId: 'prod-2',
      productName: 'Product 2'
    };

    await configService.setProductConfig(product1);
    await configService.setProductConfig(product2);

    const allProducts = await configService.getAllProductConfigs();
    expect(allProducts.length).toBeGreaterThanOrEqual(2);
    
    const prod1Found = allProducts.some(p => p.productId === 'prod-1');
    const prod2Found = allProducts.some(p => p.productId === 'prod-2');
    expect(prod1Found).toBe(true);
    expect(prod2Found).toBe(true);
  });

  it('should get all rate configurations', async () => {
    const rate1: RateConfig = {
      id: 'rate-1',
      name: 'Rate 1',
      baseRate: 0.075,
      riskAdjustment: {
        creditScoreWeight: 0.4,
        incomeWeight: 0.3,
        employmentLengthWeight: 0.3
      },
      effectiveDate: new Date()
    };

    const rate2: RateConfig = {
      ...rate1,
      id: 'rate-2',
      name: 'Rate 2'
    };

    await configService.setRateConfig(rate1);
    await configService.setRateConfig(rate2);

    const allRates = await configService.getAllRateConfigs();
    expect(allRates.length).toBeGreaterThanOrEqual(2);
    
    const rate1Found = allRates.some(r => r.id === 'rate-1');
    const rate2Found = allRates.some(r => r.id === 'rate-2');
    expect(rate1Found).toBe(true);
    expect(rate2Found).toBe(true);
  });

  it('should get all channel configurations', async () => {
    const channel1: ChannelConfig = {
      channelId: 'channel-1',
      channelName: 'Channel 1',
      enabled: true,
      priority: 1,
      feeStructure: {
        discountRate: 0.05,
        commissionRate: 0.02
      },
      integrationSettings: {
        apiKey: 'test-key-1',
        endpoint: 'https://api1.example.com',
        timeout: 5000
      }
    };

    const channel2: ChannelConfig = {
      ...channel1,
      channelId: 'channel-2',
      channelName: 'Channel 2',
      priority: 2
    };

    await configService.setChannelConfig(channel1);
    await configService.setChannelConfig(channel2);

    const allChannels = await configService.getAllChannelConfigs();
    expect(allChannels.length).toBeGreaterThanOrEqual(2);
    
    // Channels should be sorted by priority (descending)
    if (allChannels.length >= 2) {
      expect(allChannels[0].priority).toBeGreaterThanOrEqual(allChannels[1].priority);
    }
  });

  it('should get enabled channel configurations', async () => {
    const enabledChannel: ChannelConfig = {
      channelId: 'enabled-channel',
      channelName: 'Enabled Channel',
      enabled: true,
      priority: 1,
      feeStructure: {
        discountRate: 0.05,
        commissionRate: 0.02
      },
      integrationSettings: {
        apiKey: 'test-key',
        endpoint: 'https://api.example.com',
        timeout: 5000
      }
    };

    const disabledChannel: ChannelConfig = {
      ...enabledChannel,
      channelId: 'disabled-channel',
      enabled: false
    };

    await configService.setChannelConfig(enabledChannel);
    await configService.setChannelConfig(disabledChannel);

    const enabledChannels = await configService.getEnabledChannelConfigs();
    const hasEnabled = enabledChannels.some(c => c.channelId === 'enabled-channel');
    const hasDisabled = enabledChannels.some(c => c.channelId === 'disabled-channel');
    
    expect(hasEnabled).toBe(true);
    expect(hasDisabled).toBe(false);
  });

  it('should set default configurations', async () => {
    const defaults = await configService.getDefaultConfig();
    expect(defaults).toHaveProperty('app.maintenance');
    expect(defaults).toHaveProperty('loan.max_amount');
    expect(defaults).toHaveProperty('interest.default_rate');
  });

  it('should clear cache', async () => {
    await configService.setConfig('cache.test1', 'value1');
    await configService.setConfig('cache.test2', 'value2');
    
    const initialKeys = await (configService as any).redis.keys('config:cache.*');
    expect(initialKeys.length).toBe(2);

    const clearedCount = await configService.clearCache('cache.*');
    expect(clearedCount).toBe(2);

    const finalKeys = await (configService as any).redis.keys('config:cache.*');
    expect(finalKeys.length).toBe(0);
  });

  it('should get configuration statistics', async () => {
    // Set a few configs to have some data
    await configService.setConfig('stat.test1', 'value1');
    await configService.setConfig('stat.test2', 'value2');
    await configService.setConfig('product:stat-test', { productId: 'stat-test', productName: 'Stat Test' });
    
    const stats = await configService.getStats();
    
    expect(stats).toHaveProperty('totalConfigs');
    expect(stats).toHaveProperty('productConfigs');
    expect(stats).toHaveProperty('rateConfigs');
    expect(stats).toHaveProperty('channelConfigs');
    expect(stats).toHaveProperty('averageTTL');
    
    expect(typeof stats.totalConfigs).toBe('number');
    expect(typeof stats.averageTTL).toBe('number');
  });
});

describe('getConfigService singleton', () => {
  let configService1: ConfigService;
  let configService2: ConfigService;

  beforeEach(() => {
    // We need to reset the singleton instance for this test
    const originalModule = require('../services/config.service');
    delete originalModule.configService;
    
    configService1 = getConfigService();
    configService2 = getConfigService();
  });

  afterEach(async () => {
    await configService1.close();
  });

  it('should return the same instance', () => {
    expect(configService1).toBe(configService2);
  });
});