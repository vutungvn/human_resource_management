import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaveRequestsService } from './leave-requests.service.js';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto.js';
import { JwtAuthGuard } from '../auth/guards/auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { Role } from '../auth/decorators/role.enum.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@ApiTags('Leave Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(private readonly leaveService: LeaveRequestsService) { }

  @Post()
  @ApiOperation({ summary: 'Nhân viên nộp đơn nghỉ phép (trạng thái PENDING)' })
  create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    return this.leaveService.create(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Xem danh sách đơn nghỉ phép của chính mình' })
  findMine(@CurrentUser('id') userId: number) {
    return this.leaveService.findMine(userId);
  }

  @Patch(':id/approve-manager')
  @Roles(Role.MANAGER)
  @ApiOperation({
    summary: 'Cấp 1: Quản lý trực tiếp duyệt đơn (PENDING → APPROVED_BY_MANAGER)',
  })
  approveManager(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') managerId: number,
  ) {
    return this.leaveService.approveByManager(id, managerId);
  }

  @Patch(':id/approve-hr')
  @Roles(Role.HR_MANAGER)
  @ApiOperation({
    summary: 'Cấp 2: HR duyệt cuối (APPROVED_BY_MANAGER → APPROVED_BY_HR)',
  })
  approveHr(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') hrId: number,
  ) {
    return this.leaveService.approveByHr(id, hrId);
  }

  @Patch(':id/reject')
  @Roles(Role.MANAGER, Role.HR_MANAGER)
  @ApiOperation({
    summary: 'Từ chối đơn (PENDING/APPROVED_BY_MANAGER → REJECTED)',
  })
  reject(@Param('id', ParseIntPipe) id: number) {
    return this.leaveService.reject(id);
  }
}
