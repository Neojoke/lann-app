export class KVCacheService {
  constructor(private kv: KVNamespace) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.kv.get(key);
    if (value === null) {
      return null;
    }
    return JSON.parse(value);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (ttl) {
      await this.kv.put(key, JSON.stringify(value), { expirationTtl: ttl });
    } else {
      await this.kv.put(key, JSON.stringify(value));
    }
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }
}