import { Injectable } from '@nestjs/common';
import { Channel } from 'amqplib';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { ConfigService } from '@nestjs/config';
import { IAmqpConnectionManager } from 'amqp-connection-manager/dist/types/AmqpConnectionManager';
import logger from 'src/utils/logger.util';

@Injectable()
export class RabbitmqService {
  private channelWrapper: ChannelWrapper;
  private connection: IAmqpConnectionManager;
  constructor(private readonly configService: ConfigService) {
    this.connection = amqp.connect(
      this.configService.get<string>('RABBITMQ_SERVER'),
    );
  }

  async send(message: string, queue: string) {
    try {
      this.channelWrapper = this.connection.createChannel({
        setup: (channel: Channel) => {
          return channel.assertQueue(queue, { durable: true });
        },
      });
      await this.channelWrapper.sendToQueue(queue, Buffer.from(message));
    } catch (error) {
      logger(module).info(
        `Error sending message via rabbitmq: ${error.message}`,
      );
    }
  }

  async close() {
    try {
      await this.channelWrapper.close();
    } catch (error) {
      logger(module).info(
        `Error closing connection to rabbitmq: ${error.message}`,
      );
    }
  }
}
