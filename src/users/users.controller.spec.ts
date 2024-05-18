import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './users.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;
  const mockModel = {
    create: jest.fn(),
    findByIdAndDelete: jest.fn(),
    updateOne: jest.fn(),
    findOne: jest.fn(),
  };
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
  const mockAvatar = 'base64string';
  const mockDeleteAvatarResponse = 'Deleted successfully';
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
      controllers: [UsersController],
    }).compile();
    service = module.get<UsersService>(UsersService);
    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create new user', async () => {
    jest.spyOn(service, 'create').mockImplementation(() => mockUser as any);
    const user = await controller.create({
      email: 'aigbefoephraim@yahoo.com',
      name: 'Ephraim',
    });
    expect(user).toEqual(mockUser);
  });

  it('should return user by id', async () => {
    jest
      .spyOn(service, 'findById')
      .mockImplementation(() => mockUserAvatar as any);
    const user = await controller.findById({ id: '2' });
    expect(user).toEqual(mockUserAvatar);
  });

  it('should return avatar', async () => {
    jest
      .spyOn(service, 'getAvatar')
      .mockImplementation(() => mockAvatar as any);
    const avatar = await controller.getUserAvatar({ id: '2' });
    expect(avatar).toEqual(mockAvatar);
  });

  it('should delete avatar', async () => {
    jest
      .spyOn(service, 'deleteUserAvatar')
      .mockImplementation(() => mockDeleteAvatarResponse as any);
    const response = await controller.deleteAvatar({ id: '2' });
    expect(response).toEqual(mockDeleteAvatarResponse);
  });
});
