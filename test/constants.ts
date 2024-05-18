import 'dotenv/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../src/users/users.module';

export const database = process.env.DATABASE_URL_TEST;

export const imports = [MongooseModule.forRoot(database), UsersModule];
