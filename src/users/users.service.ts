import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './users.dto';
import { User } from './users.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createWriteStream, existsSync, readFileSync, unlinkSync } from 'fs';
import * as https from 'https';
import { join } from 'path';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserCreatedEmailEvent } from './events/user-created-email.event';
import { UserCreatedRabbitMQEvent } from './events/user-created-rabbitmq.event';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(payload: CreateUserDto): Promise<User | null> {
    let user = await this.userModel.findOne({ email: payload.email });
    if (user) throw new ConflictException('This email already exist');
    user = await this.userModel.create(payload);
    const userCreatedEmailEvent = new UserCreatedEmailEvent();
    userCreatedEmailEvent.to = user.email;
    userCreatedEmailEvent.subject = 'User Created';
    userCreatedEmailEvent.body = 'Your account has been created';
    this.eventEmitter.emit('user.created.email', userCreatedEmailEvent);
    const userCreatedRabbitMQEvent = new UserCreatedRabbitMQEvent();
    userCreatedRabbitMQEvent.queue = this.configService.get<string>(
      'RABBITMQ_USER_CREATION_CHANNEL',
    );
    userCreatedRabbitMQEvent.message = JSON.stringify(user);
    this.eventEmitter.emit('user.created.rabbitmq', userCreatedRabbitMQEvent);

    return user;
  }

  async findById(id: string): Promise<{
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    avatar: string;
  }> {
    try {
      const { data } = await axios.get(
        `${this.configService.get<string>('REQ_RES_API')}/users/${id}`,
      );
      return data.data;
    } catch (error) {
      throw new HttpException('User does not exist', error.response?.status);
    }
  }

  async getAvatar(id: string): Promise<string> {
    const user = await this.findById(id);
    const splitAvatar = user.avatar.split('/');
    const filename = splitAvatar[splitAvatar.length - 1];
    const filepath = join(process.cwd(), `avatars/${filename}`);
    const findUserInDb = await this.userModel.findOne({ userId: Number(id) });
    if (!findUserInDb) {
      await this.userModel.create({
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        userId: user.id,
        avatar: filename,
      });
    } else if (findUserInDb.avatar !== filename) {
      await this.userModel.updateOne(
        { _id: findUserInDb._id },
        { $set: { avatar: filename } },
      );
    } else if (existsSync(filepath)) {
      return readFileSync(filepath).toString('base64');
    }
    const file = createWriteStream(filepath);
    await new Promise((resolve) => {
      https.get(user.avatar, function (response) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve('Download Completed');
        });
      });
    });
    return readFileSync(filepath).toString('base64');
  }

  async deleteUserAvatar(id: string): Promise<string> {
    const user = await this.findById(id);
    const findUserInDb = await this.userModel.findOne({ userId: Number(id) });
    if (!findUserInDb) {
      throw new NotFoundException('User does not exist');
    }
    await this.userModel.findByIdAndDelete(findUserInDb._id);

    const splitAvatar = user.avatar.split('/');
    const filename = splitAvatar[splitAvatar.length - 1];
    const filepath = join(process.cwd(), `avatars/${filename}`);
    if (existsSync(filepath)) {
      unlinkSync(filepath);
    }
    return 'Deleted successfully';
  }
}
