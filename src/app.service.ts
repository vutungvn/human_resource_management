import { Injectable } from '@nestjs/common';
import { PrismaService } from './module/prisma/prisma.service.js';

@Injectable()
export class AppService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHello() {
    const dp = await this.prismaService.department.findMany();

    console.log('department::', dp);

    return 'Hello World!';
  }
}
