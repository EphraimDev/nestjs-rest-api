import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './users.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model } from 'mongoose';
import { HttpException } from '@nestjs/common';

const mockUser = {
  _id: '664747c53259eec40d4de8f3',
  email: 'aigbefoephraim@yahoo.com',
  name: 'Ephraim',
  createdAt: '2024-05-17T12:04:21.126Z',
  updatedAt: '2024-05-17T12:04:21.126Z',
};

const mockUserAvatar = {
  _id: '664747c53259eec40d4de8f3',
  email: 'aigbefoephraim@yahoo.com',
  name: 'Ephraim',
  createdAt: '2024-05-17T12:04:21.126Z',
  updatedAt: '2024-05-17T12:04:21.126Z',
  avatar: '2-image.jpg',
  userId: 2,
};

describe('UsersService', () => {
  let service: UsersService;
  let model: Model<User>;

  const mockModel = {
    create: jest.fn(),
    findByIdAndDelete: jest.fn(),
    updateOne: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        ConfigService,
        EventEmitter2,
        {
          // Provider for the mongoose model
          provide: getModelToken(User.name),
          useValue: mockModel,
        },
      ],
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<User>>(getModelToken(User.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create user', async () => {
    jest
      .spyOn(model, 'create')
      .mockImplementationOnce(() => Promise.resolve(mockUser as any));
    const newUser = await service.create(mockUser);
    expect(newUser.name).toEqual(mockUser.name);
  });

  it('should fail to create user if email already exist', async () => {
    jest.spyOn(model, 'findOne').mockReturnValue(mockUser as any);
    try {
      await service.create(mockUser);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
    }
  });

  it('should return user with avatar', async () => {
    const user = await service.findById('1');
    expect(user).toHaveProperty('avatar');
  });

  it('should throw exception for user not found', async () => {
    try {
      await service.findById('abc');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
    }
  });

  it('should return user avatar', async () => {
    jest.spyOn(model, 'findOne').mockReturnValue(mockUser as any);
    jest.spyOn(model, 'updateOne').mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null,
    });
    const avatar = await service.getAvatar('2');
    expect(typeof avatar).toBe('string');
  });

  it('should store user data in the database if does not exist', async () => {
    jest.spyOn(model, 'findOne').mockReturnValue(null);
    jest
      .spyOn(model, 'create')
      .mockImplementationOnce(() => Promise.resolve(mockUserAvatar as any));
    const avatar = await service.getAvatar('2');
    expect(typeof avatar).toBe('string');
  });

  it('should return avatar in base64 if file already exist in directory', async () => {
    jest.spyOn(model, 'findOne').mockReturnValue(mockUserAvatar as any);
    const avatar = await service.getAvatar('2');
    expect(typeof avatar).toBe('string');
  });

  it('should throw exception for user not found when trying to delete avatar', async () => {
    jest.spyOn(model, 'findOne').mockReturnValue(null);
    try {
      await service.deleteUserAvatar('2');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
    }
  });

  it('should delete avatar in database and file directory', async () => {
    jest.spyOn(model, 'findOne').mockReturnValue(mockUserAvatar as any);
    jest.spyOn(model, 'findByIdAndDelete');
    const response = await service.deleteUserAvatar('2');
    expect(response).toEqual('Deleted successfully');
  });
});
