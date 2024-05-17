import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './users.dto';
import { User } from './users.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { RabbitmqService } from 'src/services/rabbitmq.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from 'src/services/email.service';
import axios from 'axios';
import { createWriteStream, existsSync, readFileSync, unlinkSync } from 'fs';
import * as https from 'https';
import { join } from 'path';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly rabbitmqService: RabbitmqService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async create(payload: CreateUserDto): Promise<User | null> {
    try {
      let user = await this.userModel.findOne({ email: payload.email });
      if (user) throw new ConflictException('This email already exist');
      user = await this.userModel.create(payload);
      await Promise.all([
        this.rabbitmqService.send(
          JSON.stringify(user),
          this.configService.get('RABBITMQ_USER_CREATION_CHANNEL'),
        ),
        this.emailService.send({
          to: payload.email,
          subject: 'User Created',
          body: 'Your account has been created',
        }),
      ]);
      await this.rabbitmqService.close();
      return user;
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
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
      if (error.response?.status)
        throw new HttpException(
          error.response.status === 404
            ? 'User does not exist'
            : 'An error occured. Please try again',
          error.response.status,
        );
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAvatar(id: string): Promise<string> {
    try {
      const user = await this.findById(id);
      const splitAvatar = user.avatar.split('/');
      const filename = splitAvatar[splitAvatar.length - 1];
      const filepath = join(process.cwd(), `avatars/${filename}`);
      let findUserInDb = await this.userModel.findOne({ userId: Number(id) });
      if (!findUserInDb) {
        await this.userModel.create({
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          userId: user.id,
          avatar: filename,
        });
      } else if (findUserInDb.avatar !== filename) {
        await this.userModel.updateOne(
          { _id: findUserInDb.id },
          { $set: { avatar: filename } },
        );
      } else if (existsSync(filepath)) {
        return readFileSync(filepath).toString('base64');
      }
      const file = createWriteStream(filepath);
      await new Promise((resolve, _reject) => {
        https.get(user.avatar, function (response) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log('done');
            resolve('Download Completed');
          });
        });
      });
      return readFileSync(filepath).toString('base64');
    } catch (error) {
      if (error.response)
        throw new HttpException(
          error.response.message,
          error.response.statusCode,
        );
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteUserAvatar(id: string): Promise<string> {
    try {
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
    } catch (error) {
      if (error.response)
        throw new HttpException(
          error.response.message,
          error.response.statusCode,
        );
      throw new InternalServerErrorException(error.message);
    }
  }
}
