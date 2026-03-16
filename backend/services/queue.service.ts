import { Logger } from './logger.service';

interface QueueMessage {
  id: string;
  type: string;
  payload: any;
  priority: number;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
  delay?: number;
}

interface DeadLetterQueueMessage extends QueueMessage {
  originalError: string;
  failedAt: Date;
}

class MessageQueueService {
  private queue: QueueMessage[] = [];
  private deadLetterQueue: DeadLetterQueueMessage[] = [];
  private processing: boolean = false;
  private readonly maxRetries: number = 3;
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger('QueueService');
    this.startProcessing();
  }

  /**
   * 添加消息到队列
   */
  async enqueue(
    type: string, 
    payload: any, 
    priority: number = 1,
    delay?: number,
    maxAttempts: number = this.maxRetries
  ): Promise<string> {
    const messageId = this.generateId();
    
    const message: QueueMessage = {
      id: messageId,
      type,
      payload,
      priority,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts,
      delay
    };

    // 如果有延迟，稍后添加到队列
    if (delay && delay > 0) {
      setTimeout(() => {
        this.addToQueue(message);
      }, delay);
    } else {
      this.addToQueue(message);
    }

    this.logger.info(`Message enqueued: ${messageId}`, { type, priority });
    return messageId;
  }

  private addToQueue(message: QueueMessage) {
    // 根据优先级插入合适的位置
    const insertIndex = this.queue.findIndex(qm => qm.priority < message.priority);
    
    if (insertIndex === -1) {
      this.queue.push(message);
    } else {
      this.queue.splice(insertIndex, 0, message);
    }
  }

  /**
   * 处理队列消息
   */
  private async processMessages(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const message = this.queue.shift();
        if (!message) continue;

        await this.processMessage(message);
      }
    } catch (error) {
      this.logger.error('Error processing messages', error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * 处理单个消息
   */
  private async processMessage(message: QueueMessage): Promise<boolean> {
    try {
      this.logger.debug(`Processing message: ${message.id}`, { type: message.type });

      // 模拟消息处理
      await this.handleMessageType(message);

      this.logger.info(`Message processed successfully: ${message.id}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to process message: ${message.id}`, error);
      
      message.attempts++;
      
      if (message.attempts >= message.maxAttempts) {
        // 移动到死信队列
        await this.moveToDeadLetterQueue(message, error);
        return false;
      } else {
        // 重新加入队列（带退避策略）
        const backoffDelay = Math.pow(2, message.attempts) * 1000; // 指数退避
        this.addToQueue({
          ...message,
          delay: backoffDelay
        });
        
        setTimeout(() => {
          this.processMessages();
        }, backoffDelay);
      }
    }
  }

  /**
   * 根据消息类型处理
   */
  private async handleMessageType(message: QueueMessage): Promise<void> {
    switch (message.type) {
      case 'notification':
        await this.handleNotification(message.payload);
        break;
      case 'email':
        await this.handleEmail(message.payload);
        break;
      case 'sms':
        await this.handleSms(message.payload);
        break;
      case 'payment':
        await this.handlePayment(message.payload);
        break;
      case 'report':
        await this.handleReport(message.payload);
        break;
      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  }

  private async handleNotification(payload: any): Promise<void> {
    // 实现通知处理逻辑
    console.log('Handling notification:', payload);
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async handleEmail(payload: any): Promise<void> {
    // 实现邮件处理逻辑
    console.log('Handling email:', payload);
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  private async handleSms(payload: any): Promise<void> {
    // 实现短信处理逻辑
    console.log('Handling SMS:', payload);
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  private async handlePayment(payload: any): Promise<void> {
    // 实现支付处理逻辑
    console.log('Handling payment:', payload);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  private async handleReport(payload: any): Promise<void> {
    // 实现报表处理逻辑
    console.log('Handling report:', payload);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * 移动消息到死信队列
   */
  private async moveToDeadLetterQueue(message: QueueMessage, error: any): Promise<void> {
    const dlqMessage: DeadLetterQueueMessage = {
      ...message,
      originalError: error.message || String(error),
      failedAt: new Date()
    };

    this.deadLetterQueue.push(dlqMessage);
    this.logger.warn(`Moved message to dead letter queue: ${message.id}`, { 
      error: dlqMessage.originalError,
      attempts: message.attempts
    });
  }

  /**
   * 获取死信队列消息
   */
  getDeadLetterQueue(): DeadLetterQueueMessage[] {
    return [...this.deadLetterQueue];
  }

  /**
   * 重新处理死信队列中的消息
   */
  async retryDeadLetterMessages(): Promise<void> {
    const messagesToRetry = [...this.deadLetterQueue];
    this.deadLetterQueue = [];

    for (const dlqMessage of messagesToRetry) {
      // 重置尝试次数并重新入队
      const retryMessage: QueueMessage = {
        ...dlqMessage,
        attempts: 0
      };
      this.addToQueue(retryMessage);
    }

    this.logger.info(`Retried ${messagesToRetry.length} messages from dead letter queue`);
  }

  /**
   * 获取队列统计信息
   */
  getStats(): { pending: number; processing: boolean; dlqCount: number } {
    return {
      pending: this.queue.length,
      processing: this.processing,
      dlqCount: this.deadLetterQueue.length
    };
  }

  /**
   * 开始处理消息循环
   */
  private startProcessing(): void {
    setInterval(async () => {
      await this.processMessages();
    }, 1000); // 每秒检查一次队列
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// 单例模式
let queueService: MessageQueueService;

export function getQueueService(): MessageQueueService {
  if (!queueService) {
    queueService = new MessageQueueService();
  }
  return queueService;
}

export { MessageQueueService };