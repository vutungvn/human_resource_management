import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import * as bcrypt from 'bcrypt';
import { EmployeeStatus } from '../../generated/enums.js';
import { excludePassword } from './dto/employee-response.dto.js';

const SALT_ROUNDS = 10;

@Injectable()
export class EmployeesService {
  constructor(private readonly prismaService: PrismaService) {}

  // Thêm nhân sự
  async create(createEmployeeDto: CreateEmployeeDto) {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      departmentId,
      jobTitleId,
      managerId,
      status,
    } = createEmployeeDto;

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    try {
      const employee = await this.prismaService.employee.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role,
          departmentId,
          jobTitleId,
          managerId,
          status: status ?? EmployeeStatus.ACTIVE,
        },
      });

      return excludePassword(employee);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('Email đã tồn tại trong hệ thống');
      }
      throw error;
    }
  }
}
