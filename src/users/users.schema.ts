import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      ret.id = doc._id;
      delete ret._id;
      delete ret.__v;
    },
  },
})
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatar: string;

  @Prop()
  userId: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
