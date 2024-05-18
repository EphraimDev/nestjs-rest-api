import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, FindUserByIdDto } from './users.dto';

@ApiTags('Users')
@Controller("api")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiResponse({ status: 201, description: 'Successful' })
  @Post('/users')
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @ApiResponse({ status: 200, description: 'Successful' })
  @Get('/user/:id')
  findById(@Param() param: FindUserByIdDto) {
    return this.usersService.findById(param.id);
  }

  @ApiResponse({ status: 200, description: 'Successful' })
  @Get('/user/:id/avatar')
  async getUserAvatar(@Param() param: FindUserByIdDto) {
    return this.usersService.getAvatar(param.id);
  }

  @ApiResponse({ status: 200, description: 'Successful' })
  @Delete('/user/:id/avatar')
  deleteAvatar(@Param() param: FindUserByIdDto) {
    return this.usersService.deleteUserAvatar(param.id);
  }
}
