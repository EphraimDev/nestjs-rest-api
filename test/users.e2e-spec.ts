import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { UsersModule } from './../src/users/users.module';
import mongoose from 'mongoose';
import { database, imports } from './constants';
import { CreateUserDto } from '../src/users/users.dto';
import { ConfigService } from '@nestjs/config';

beforeAll(async () => {
  await mongoose.connect(database);
  await mongoose.connection.db.dropDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports,
      providers: [ConfigService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  const createNewUser: CreateUserDto = {
    name: 'Test User',
    email: 'testemail@email.com',
  };

  it('/api/users (POST) 201', () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .send(createNewUser)
      .expect(({ body }) => {
        expect(body.name).toEqual(createNewUser.name);
        expect(body.email).toEqual(createNewUser.email);
      })
      .expect(HttpStatus.CREATED);
  });

  it('/api/users (POST) 409', () => {
    return request(app.getHttpServer())
      .post('/api/users')
      .send(createNewUser)
      .expect(({ body }) => {
        expect(body.message).toEqual('This email already exist');
      })
      .expect(HttpStatus.CONFLICT);
  });

  it('/api/user/:id (GET) 200', () => {
    return request(app.getHttpServer())
      .get('/api/user/1')
      .expect(({ body }) => {
        expect(body.avatar).toBeDefined();
        expect(body.email).toBeDefined();
      })
      .expect(HttpStatus.OK);
  });

  it('/api/user/:id (GET) 404', () => {
    return request(app.getHttpServer())
      .get('/api/user/abc')
      .expect(({body}) => {
        expect(body.message).toEqual('User does not exist');
      })
      .expect(HttpStatus.NOT_FOUND);
  });

  it('/api/user/:id/avatar (GET) 200', () => {
    return request(app.getHttpServer())
      .get('/api/user/1/avatar')
      .expect(({ body }) => {
        expect(body).toBeDefined();
      })
      .expect(HttpStatus.OK);
  });

  it('/api/user/:id/avatar (DELETE) 200', () => {
    return request(app.getHttpServer())
      .delete('/api/user/1/avatar')
      .expect(HttpStatus.OK);
  });

  it('/api/user/:id/avatar (DELETE) 404', () => {
    return request(app.getHttpServer())
      .delete('/api/user/1/avatar')
      .expect(({ body }) => {
        expect(body.message).toEqual('User does not exist');
      })
      .expect(HttpStatus.NOT_FOUND);
  });
});
