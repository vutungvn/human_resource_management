import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Role } from './module/auth/decorators/role.enum.js';
import { Roles } from './module/auth/decorators/role.decorator.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Roles(Role.ADMIN,Role.MANAGER)
  getHello() {
    return this.appService.getHello();
  }
}
