import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import * as bcrypt from 'bcrypt';
import { EmployeeStatus } from '../../generated/enums.js';
import { excludePassword } from './dto/employee-response.dto.js';
import { QueryEmployeeDto } from './dto/query-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { AuditContext } from '../../common/audit/audit-context.interface.js';

const SALT_ROUNDS = 10;

@Injectable()
export class EmployeesService {
  constructor(private readonly prismaService: PrismaService) {}

  // Thêm nhân sự
  async create(createEmployeeDto: CreateEmployeeDto, ctx: AuditContext) {
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
      const employee = await this.prismaService.withAuditContext(ctx, (tx) =>
        tx.employee.create({
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
        }),
      );

      return excludePassword(employee);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('Email đã tồn tại trong hệ thống');
      }
      throw error;
    }
  }

  // Lấy danh sách nhân sự
  async findAll(queryEmployeeDto: QueryEmployeeDto) {
    const { page, limit, search, departmentId } = queryEmployeeDto;

    const where = {
      ...(departmentId ? { departmentId } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prismaService.$transaction([
      this.prismaService.employee.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'asc' },
        include: {
          department: true,
          jobTitle: true,
        },
      }),

      this.prismaService.employee.count({ where }),
    ]);

    return {
      data: data.map(excludePassword),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Lấy nhân sự theo id
  async findOne(id: number) {
    const employee = await this.prismaService.employee.findUnique({
      where: { id },
      include: {
        department: true,
        jobTitle: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Không tìm thấy nhân viên có ID ${id}`);
    }
    return excludePassword(employee);
  }

  // Cập nhật nhân sự
  async update(
    id: number,
    updateEmployeeDto: UpdateEmployeeDto,
    ctx: AuditContext,
  ) {
    await this.findOne(id);

    const data = { ...updateEmployeeDto };

    if (updateEmployeeDto.password) {
      data.password = await bcrypt.hash(
        updateEmployeeDto.password,
        SALT_ROUNDS,
      );
    }

    try {
      const employee = await this.prismaService.withAuditContext(ctx, (tx) =>
        tx.employee.update({
          where: { id },
          data,
        }),
      );

      return excludePassword(employee);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('Email đã tồn tại trong hệ thống');
      }
      throw error;
    }
  }

  // Xóa nhân sự
  async remove(id: number, ctx: AuditContext) {
    await this.findOne(id);

    const employee = await this.prismaService.withAuditContext(ctx, (tx) =>
      tx.employee.update({
        where: { id },
        data: { status: EmployeeStatus.TERMINATED },
      }),
    );

    return excludePassword(employee);
  }
}
