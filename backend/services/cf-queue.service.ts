export class CFQueueService {
  constructor(private queue: Queue<QueueMessage>) {}

  async publish(message: QueueMessage): Promise<void> {
    await this.queue.send(message);
  }
}