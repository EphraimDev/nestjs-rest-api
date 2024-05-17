import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ required: true })
  @IsEmail()
  email: string;

  @ApiProperty({ required: true })
  // @IsString()
  name: string;
}

export class FindUserByIdDto {
  @ApiProperty({ required: true })
  id: string;
}
