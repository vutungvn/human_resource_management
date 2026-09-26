import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PayrollsService } from './payrolls.service.js';
import { ProcessPayrollDto } from './dto/process-payroll.dto.js';
import { JwtAuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { Role } from '../auth/decorators/role.enum.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { AuditCtx } from '../../common/decorators/audit-context.decorator.js';
import type { AuditContext } from '../../common/audit/audit-context.interface.js';

@ApiTags('Payrolls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payrolls')
export class PayrollsController {
  constructor(private readonly payrollsService: PayrollsService) {}

  @Post('process')
  @Roles(Role.HR_MANAGER)
  @ApiOperation({
    summary: 'HR khởi tạo bảng lương theo kỳ cho toàn bộ nhân viên ACTIVE',
  })
  process(@AuditCtx() ctx: AuditContext, @Body() dto: ProcessPayrollDto) {
    return this.payrollsService.processPayroll(ctx, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Nhân viên xem phiếu lương của chính mình' })
  findMine(@CurrentUser('id') userId: number) {
    return this.payrollsService.findMine(userId);
  }

  @Get()
  @Roles(Role.HR_MANAGER, Role.ADMIN)
  @ApiOperation({ summary: 'HR/ADMIN xem toàn bộ phiếu lương công ty' })
  findAll() {
    return this.payrollsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết 1 phiếu lương (của mình, hoặc mọi người nếu là HR/ADMIN)' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.payrollsService.findOne(id, user);
  }
}
