import { MessageQueueService } from './services/queue.service.ts';

console.log('Testing queue service import...');
const queueService = new MessageQueueService();
console.log('Queue service created successfully!');
console.log('Queue service methods:', Object.getOwnPropertyNames(MessageQueueService.prototype));