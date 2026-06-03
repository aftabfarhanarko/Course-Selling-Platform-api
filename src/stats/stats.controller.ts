import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  getStats() {
    return this.statsService.getStats();
  }

  @Get('admin-dashboard')
  getAdminDashboardStats() {
    return this.statsService.getAdminDashboardStats();
  }

  @UseGuards(JwtAuthGuard)
  @Get('student-dashboard')
  getStudentDashboardStats(@Req() req: any) {
    return this.statsService.getStudentDashboardStats(req.user.id);
  }
}
