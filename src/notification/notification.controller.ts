import { Controller, Get, Patch, Param } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications() {
    const data = await this.notificationService.findAll();
    return {
      success: true,
      data,
    };
  }

  @Patch('read-all')
  async markAllAsRead() {
    return this.notificationService.markAllAsRead();
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    const data = await this.notificationService.markAsRead(id);
    return {
      success: true,
      data,
    };
  }
}
