import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';

@Injectable()
export class NotificationService implements OnModuleInit {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async onModuleInit() {
    const count = await this.notificationRepository.count();
    if (count === 0) {
      await this.notificationRepository.save([
        {
          title: 'New Student Enrollment',
          message: 'Aftab Farhan enrolled in Next.js Advanced Course',
          type: 'enrollment',
          isRead: false,
        },
        {
          title: 'Withdrawal Requested',
          message: '$250 withdrawal requested by Instructor Rahat',
          type: 'withdraw',
          isRead: false,
        },
        {
          title: 'System Update',
          message: 'Course Selling Platform v2.0 update completed',
          type: 'info',
          isRead: false,
        },
        {
          title: 'New Course Submission',
          message: 'Python for Data Science course submitted for review',
          type: 'course',
          isRead: true,
        },
        {
          title: 'Payment Received',
          message: 'Payment of $99 received via bKash',
          type: 'payment',
          isRead: true,
        },
      ]);
    }
  }

  async findAll() {
    return this.notificationRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string) {
    await this.notificationRepository.update(id, { isRead: true });
    return this.notificationRepository.findOne({ where: { id } });
  }

  async markAllAsRead() {
    await this.notificationRepository.update({}, { isRead: true });
    return { success: true };
  }
}
