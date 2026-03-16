import Redis from 'ioredis';
import { Logger } from './logger.service';

interface ConfigValue {
  value: any;
  updatedAt: Date;
  expiresAt?: Date;
  version: number;
}

interface ProductConfig {
  productId: string;
  productName: string;
  interestRate: number;
  maxAmount: number;
  minAmount: number;
  termOptions: number[]; // 期限选项（月）
  eligibilityCriteria: {
    minAge: number;
    maxAge: number;
    minIncome: number;
    creditScoreThreshold: number;
  };
  fees: {
    applicationFee: number;
    processingFee: number;
    latePaymentFee: number;
  };
}

interface RateConfig {
  id: string;
  name: string;
  baseRate: number;
  riskAdjustment: {
    creditScoreWeight: number;
    incomeWeight: number;
    employmentLengthWeight: number;
  };
  effectiveDate: Date;
  endDate?: Date;
}

interface ChannelConfig {
  channelId: string;
  channelName: string;
  enabled: boolean;
  priority: number;
  feeStructure: {
    discountRate: number;
    commissionRate: number;
  };
  integrationSettings: {
    apiKey: string;
    endpoint: string;
    timeout: number;
  };
}

class ConfigService {
  private redis: Redis;
  private readonly logger: Logger;
  private readonly defaultTTL: number = 3600; // 1小时默认TTL

  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    this.logger = new Logger('ConfigService');
    this.setupRedisListeners();
  }

  private setupRedisListeners(): void {
    this.redis.on('connect', () => {
      this.logger.info('Connected to Redis');
    });

    this.redis.on('error', (err) => {
      this.logger.error('Redis connection error', err);
    });
  }

  /**
   * 设置配置项
   */
  async setConfig(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const configValue: ConfigValue = {
        value,
        updatedAt: new Date(),
        expiresAt: ttl ? new Date(Date.now() + ttl * 1000) : undefined,
        version: Date.now() // 使用时间戳作为版本号
      };

      const serializedValue = JSON.stringify(configValue);
      const redisKey = `config:${key}`;

      if (ttl) {
        await this.redis.setex(redisKey, ttl, serializedValue);
      } else {
        await this.redis.set(redisKey, serializedValue);
      }

      this.logger.debug(`Config set: ${key}`, { ttl });
    } catch (error) {
      this.logger.error(`Failed to set config: ${key}`, error);
      throw error;
    }
  }

  /**
   * 获取配置项
   */
  async getConfig<T = any>(key: string): Promise<T | null> {
    try {
      const redisKey = `config:${key}`;
      const value = await this.redis.get(redisKey);

      if (value === null) {
        this.logger.debug(`Config not found: ${key}`);
        return null;
      }

      const configValue: ConfigValue = JSON.parse(value);
      
      // 检查是否过期
      if (configValue.expiresAt && new Date() > new Date(configValue.expiresAt)) {
        await this.deleteConfig(key);
        return null;
      }

      this.logger.debug(`Config retrieved: ${key}`);
      return configValue.value as T;
    } catch (error) {
      this.logger.error(`Failed to get config: ${key}`, error);
      return null;
    }
  }

  /**
   * 删除配置项
   */
  async deleteConfig(key: string): Promise<boolean> {
    try {
      const redisKey = `config:${key}`;
      const result = await this.redis.del(redisKey);
      
      if (result > 0) {
        this.logger.debug(`Config deleted: ${key}`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Failed to delete config: ${key}`, error);
      return false;
    }
  }

  /**
   * 批量获取配置
   */
  async getConfigs(keys: string[]): Promise<Record<string, any>> {
    const result: Record<string, any> = {};
    
    for (const key of keys) {
      result[key] = await this.getConfig(key);
    }
    
    return result;
  }

  /**
   * 批量设置配置
   */
  async setConfigs(configs: Record<string, any>, ttl?: number): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const [key, value] of Object.entries(configs)) {
      const configValue: ConfigValue = {
        value,
        updatedAt: new Date(),
        expiresAt: ttl ? new Date(Date.now() + ttl * 1000) : undefined,
        version: Date.now()
      };

      const serializedValue = JSON.stringify(configValue);
      const redisKey = `config:${key}`;

      if (ttl) {
        pipeline.setex(redisKey, ttl, serializedValue);
      } else {
        pipeline.set(redisKey, serializedValue);
      }
    }
    
    await pipeline.exec();
    this.logger.debug(`Batch config set: ${Object.keys(configs).length} items`);
  }

  /**
   * 获取产品配置
   */
  async getProductConfig(productId: string): Promise<ProductConfig | null> {
    return await this.getConfig<ProductConfig>(`product:${productId}`);
  }

  /**
   * 设置产品配置
   */
  async setProductConfig(config: ProductConfig): Promise<void> {
    await this.setConfig(`product:${config.productId}`, config, this.defaultTTL * 24); // 产品配置保留24小时
  }

  /**
   * 获取所有产品配置
   */
  async getAllProductConfigs(): Promise<ProductConfig[]> {
    const keys = await this.redis.keys('config:product:*');
    const configs: ProductConfig[] = [];

    for (const key of keys) {
      const config = await this.getConfig<ProductConfig>(key.replace('config:', ''));
      if (config) {
        configs.push(config);
      }
    }

    return configs;
  }

  /**
   * 获取费率配置
   */
  async getRateConfig(rateId: string): Promise<RateConfig | null> {
    return await this.getConfig<RateConfig>(`rate:${rateId}`);
  }

  /**
   * 设置费率配置
   */
  async setRateConfig(config: RateConfig): Promise<void> {
    await this.setConfig(`rate:${config.id}`, config, this.defaultTTL * 24); // 费率配置保留24小时
  }

  /**
   * 获取当前有效的费率配置
   */
  async getCurrentRateConfig(): Promise<RateConfig | null> {
    const allRates = await this.getAllRateConfigs();
    const now = new Date();
    
    // 找到当前生效的费率配置（有效期内，且是最新的）
    const currentRate = allRates
      .filter(rate => 
        rate.effectiveDate <= now && 
        (!rate.endDate || rate.endDate >= now)
      )
      .sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime())[0];
    
    return currentRate || null;
  }

  /**
   * 获取所有费率配置
   */
  async getAllRateConfigs(): Promise<RateConfig[]> {
    const keys = await this.redis.keys('config:rate:*');
    const configs: RateConfig[] = [];

    for (const key of keys) {
      const config = await this.getConfig<RateConfig>(key.replace('config:', ''));
      if (config) {
        configs.push(config);
      }
    }

    return configs;
  }

  /**
   * 获取渠道配置
   */
  async getChannelConfig(channelId: string): Promise<ChannelConfig | null> {
    return await this.getConfig<ChannelConfig>(`channel:${channelId}`);
  }

  /**
   * 设置渠道配置
   */
  async setChannelConfig(config: ChannelConfig): Promise<void> {
    await this.setConfig(`channel:${config.channelId}`, config, this.defaultTTL * 6); // 渠道配置保留6小时
  }

  /**
   * 获取所有渠道配置
   */
  async getAllChannelConfigs(): Promise<ChannelConfig[]> {
    const keys = await this.redis.keys('config:channel:*');
    const configs: ChannelConfig[] = [];

    for (const key of keys) {
      const config = await this.getConfig<ChannelConfig>(key.replace('config:', ''));
      if (config) {
        configs.push(config);
      }
    }

    // 按优先级排序
    configs.sort((a, b) => b.priority - a.priority);
    
    return configs;
  }

  /**
   * 获取启用的渠道配置
   */
  async getEnabledChannelConfigs(): Promise<ChannelConfig[]> {
    const allConfigs = await this.getAllChannelConfigs();
    return allConfigs.filter(config => config.enabled);
  }

  /**
   * 获取默认配置
   */
  async getDefaultConfig(): Promise<Record<string, any>> {
    const defaults = {
      'app.maintenance': false,
      'app.version': '1.0.0',
      'loan.max_amount': 100000,
      'loan.min_amount': 1000,
      'loan.max_term': 36,
      'loan.min_term': 3,
      'credit.min_score': 600,
      'interest.default_rate': 0.12,
      'fee.application': 50,
      'fee.processing': 100,
      'notification.sms_enabled': true,
      'notification.email_enabled': true,
      'security.rate_limit': 1000,
      'security.cors_origin': '*'
    };

    // 检查哪些默认配置尚未设置
    const pipeline = this.redis.pipeline();
    const missingDefaults: Record<string, any> = {};

    for (const [key, value] of Object.entries(defaults)) {
      pipeline.get(`config:${key}`);
    }

    const results = await pipeline.exec();
    
    let index = 0;
    for (const [key, value] of Object.entries(defaults)) {
      if (results![index]![1] === null) {
        missingDefaults[key] = value;
      }
      index++;
    }

    // 设置缺失的默认配置
    if (Object.keys(missingDefaults).length > 0) {
      await this.setConfigs(missingDefaults);
      this.logger.info(`Set ${Object.keys(missingDefaults).length} default configurations`);
    }

    return defaults;
  }

  /**
   * 清除配置缓存
   */
  async clearCache(pattern: string = '*'): Promise<number> {
    const keys = await this.redis.keys(`config:${pattern}`);
    if (keys.length === 0) return 0;

    const count = await this.redis.del(...keys);
    this.logger.info(`Cleared ${count} config cache entries with pattern: ${pattern}`);
    return count;
  }

  /**
   * 监听配置变化
   */
  async subscribeToConfigChanges(callback: (key: string, value: any) => void): Promise<void> {
    // 使用 Redis 发布订阅功能监听配置变化
    const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    subscriber.subscribe('config-changes', (err, count) => {
      if (err) {
        this.logger.error('Failed to subscribe to config changes', err);
        return;
      }
      this.logger.info(`Subscribed to config changes, channel count: ${count}`);
    });

    subscriber.on('message', async (channel, message) => {
      try {
        const { key, value } = JSON.parse(message);
        callback(key, value);
      } catch (error) {
        this.logger.error('Failed to parse config change message', error);
      }
    });
  }

  /**
   * 发布配置变化
   */
  async publishConfigChange(key: string, value: any): Promise<void> {
    const message = JSON.stringify({ key, value });
    await this.redis.publish('config-changes', message);
  }

  /**
   * 验证配置
   */
  validateConfig(key: string, value: any): boolean {
    try {
      switch (key) {
        case 'app.maintenance':
          return typeof value === 'boolean';
        case 'app.version':
          return typeof value === 'string' && /^[0-9]+\.[0-9]+\.[0-9]+$/.test(value);
        case 'loan.max_amount':
        case 'loan.min_amount':
          return typeof value === 'number' && value > 0;
        case 'loan.max_term':
        case 'loan.min_term':
          return typeof value === 'number' && value > 0 && value <= 120;
        case 'credit.min_score':
          return typeof value === 'number' && value >= 300 && value <= 850;
        case 'interest.default_rate':
          return typeof value === 'number' && value >= 0 && value <= 1;
        case 'fee.application':
        case 'fee.processing':
          return typeof value === 'number' && value >= 0;
        case 'notification.sms_enabled':
        case 'notification.email_enabled':
          return typeof value === 'boolean';
        case 'security.rate_limit':
          return typeof value === 'number' && value > 0;
        case 'security.cors_origin':
          return typeof value === 'string';
        default:
          // 对于产品、费率、渠道配置，进行更复杂的验证
          if (key.startsWith('product:')) {
            return this.validateProductConfig(value);
          } else if (key.startsWith('rate:')) {
            return this.validateRateConfig(value);
          } else if (key.startsWith('channel:')) {
            return this.validateChannelConfig(value);
          }
          // 其他配置默认通过验证
          return true;
      }
    } catch (error) {
      this.logger.error(`Config validation error for ${key}`, error);
      return false;
    }
  }

  /**
   * 验证产品配置
   */
  private validateProductConfig(config: ProductConfig): boolean {
    return !!(
      config &&
      config.productId &&
      config.productName &&
      typeof config.interestRate === 'number' &&
      config.interestRate >= 0 &&
      typeof config.maxAmount === 'number' &&
      config.maxAmount > 0 &&
      typeof config.minAmount === 'number' &&
      config.minAmount > 0 &&
      Array.isArray(config.termOptions) &&
      config.termOptions.length > 0 &&
      config.eligibilityCriteria &&
      typeof config.fees === 'object'
    );
  }

  /**
   * 验证费率配置
   */
  private validateRateConfig(config: RateConfig): boolean {
    return !!(
      config &&
      config.id &&
      config.name &&
      typeof config.baseRate === 'number' &&
      config.baseRate >= 0 &&
      config.riskAdjustment &&
      typeof config.effectiveDate === 'object'
    );
  }

  /**
   * 验证渠道配置
   */
  private validateChannelConfig(config: ChannelConfig): boolean {
    return !!(
      config &&
      config.channelId &&
      config.channelName &&
      typeof config.enabled === 'boolean' &&
      typeof config.priority === 'number' &&
      config.feeStructure &&
      config.integrationSettings
    );
  }

  /**
   * 获取配置统计
   */
  async getStats(): Promise<{
    totalConfigs: number;
    productConfigs: number;
    rateConfigs: number;
    channelConfigs: number;
    averageTTL: number;
  }> {
    const allKeys = await this.redis.keys('config:*');
    
    let totalTTL = 0;
    let validTTLCnt = 0;
    
    for (const key of allKeys) {
      const ttl = await this.redis.ttl(key);
      if (ttl > 0) {
        totalTTL += ttl;
        validTTLCnt++;
      }
    }
    
    const avgTTL = validTTLCnt > 0 ? totalTTL / validTTLCnt : 0;
    
    return {
      totalConfigs: allKeys.length,
      productConfigs: await this.redis.keys('config:product:*').then(keys => keys.length),
      rateConfigs: await this.redis.keys('config:rate:*').then(keys => keys.length),
      channelConfigs: await this.redis.keys('config:channel:*').then(keys => keys.length),
      averageTTL: avgTTL
    };
  }

  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    await this.redis.quit();
    this.logger.info('ConfigService closed');
  }
}

// 单例模式
let configService: ConfigService;

export function getConfigService(redisUrl?: string): ConfigService {
  if (!configService) {
    configService = new ConfigService(redisUrl);
  }
  return configService;
}

export { 
  ConfigService, 
  ProductConfig, 
  RateConfig, 
  ChannelConfig,
  ConfigValue 
};