import { describe, it, expect } from 'vitest';
import { MessageQueueService } from '../../services/queue.service';

describe('QueueService Integration', () => {
  it('should be able to instantiate', () => {
    const service = new MessageQueueService();
    expect(service).toBeDefined();
  });
});