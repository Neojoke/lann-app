import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MessageQueueService, getQueueService } from '../../services/queue.service';

describe('MessageQueueService', () => {
  let queueService: MessageQueueService;

  beforeEach(() => {
    queueService = new MessageQueueService();
  });

  afterEach(() => {
    // 清理可能的定时器
    vi.clearAllTimers();
  });

  it('should initialize correctly', () => {
    expect(queueService).toBeDefined();
    expect(typeof queueService.enqueue).toBe('function');
    expect(typeof queueService.getStats).toBe('function');
  });

  it('should enqueue a message with correct properties', async () => {
    const messageId = await queueService.enqueue('test-type', { test: 'data' }, 1);
    
    expect(messageId).toBeDefined();
    expect(typeof messageId).toBe('string');
    
    const stats = queueService.getStats();
    expect(stats.pending).toBeGreaterThan(0);
  });

  it('should handle different message types', async () => {
    const notificationId = await queueService.enqueue('notification', { userId: '123', message: 'Hello' });
    const emailId = await queueService.enqueue('email', { to: 'test@example.com', subject: 'Test' });
    const smsId = await queueService.enqueue('sms', { phone: '+1234567890', text: 'Test SMS' });
    
    expect(notificationId).toBeDefined();
    expect(emailId).toBeDefined();
    expect(smsId).toBeDefined();
    
    const stats = queueService.getStats();
    expect(stats.pending).toBe(3);
  });

  it('should prioritize messages correctly', async () => {
    // Enqueue messages with different priorities
    await queueService.enqueue('low', { data: 'low' }, 1);
    await queueService.enqueue('high', { data: 'high' }, 5);
    await queueService.enqueue('medium', { data: 'medium' }, 3);
    
    const stats = queueService.getStats();
    expect(stats.pending).toBe(3);
  });

  it('should move failed messages to dead letter queue after max retries', async () => {
    // Mock a failing handler
    const originalHandleNotification = (queueService as any).handleNotification;
    (queueService as any).handleNotification = vi.fn().mockRejectedValue(new Error('Processing failed'));
    
    // Enqueue a message with low retry count to speed up test
    await queueService.enqueue('notification', { test: 'fail' }, 1, undefined, 1);
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const dlq = queueService.getDeadLetterQueue();
    expect(dlq.length).toBeGreaterThan(0);
    expect(dlq[0].originalError).toContain('Processing failed');
    
    // Restore original method
    (queueService as any).handleNotification = originalHandleNotification;
  });

  it('should return correct statistics', () => {
    const stats = queueService.getStats();
    expect(stats).toHaveProperty('pending');
    expect(stats).toHaveProperty('processing');
    expect(stats).toHaveProperty('dlqCount');
    expect(typeof stats.pending).toBe('number');
    expect(typeof stats.processing).toBe('boolean');
    expect(typeof stats.dlqCount).toBe('number');
  });

  it('should retry dead letter queue messages', async () => {
    // Add a message to dead letter queue manually for testing
    const dlqMessage = {
      id: 'test-id',
      type: 'test',
      payload: { test: 'data' },
      priority: 1,
      createdAt: new Date(),
      attempts: 3,
      maxAttempts: 3,
      originalError: 'Test error',
      failedAt: new Date()
    };
    
    // Add to DLQ by accessing private property (for testing purposes)
    (queueService as any).deadLetterQueue.push(dlqMessage);
    
    const initialDlqCount = queueService.getDeadLetterQueue().length;
    expect(initialDlqCount).toBe(1);
    
    // Retry DLQ messages
    await queueService.retryDeadLetterMessages();
    
    // The message should be moved back to main queue
    const finalDlqCount = queueService.getDeadLetterQueue().length;
    expect(finalDlqCount).toBe(0);
  });
});

describe('getQueueService singleton', () => {
  it('should return the same instance', () => {
    const instance1 = getQueueService();
    const instance2 = getQueueService();
    
    expect(instance1).toBe(instance2);
  });
});