import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment, EnrollmentStatus } from '../enrollment/entities/enrollment.entity';
import { Course } from '../course/entities/course.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
  ) {}

  async getStats() {
    // 1. Total Revenue
    const { totalRevenue } = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .select('SUM(enrollment.amount)', 'totalRevenue')
      .where('enrollment.status = :status', { status: EnrollmentStatus.COMPLETED })
      .getRawOne();
      
    // 2. Course Sales
    const courseSales = await this.enrollmentRepository.count({
      where: { status: EnrollmentStatus.COMPLETED }
    });

    // 3. Active Students
    const { activeStudents } = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .select('COUNT(DISTINCT enrollment.studentId)', 'activeStudents')
      .where('enrollment.status = :status', { status: EnrollmentStatus.COMPLETED })
      .getRawOne();

    // 4. Published Courses
    const publishedCourses = await this.courseRepository.count({
      where: { isPublished: true }
    });

    const kpis = [
      {
        label: 'Total Revenue',
        value: `$${Number(totalRevenue || 0).toLocaleString()}`,
        delta: 'N/A',
        trend: 'up',
        icon: 'DollarSign',
        hint: 'Total all time',
      },
      {
        label: 'Course Sales',
        value: courseSales.toLocaleString(),
        delta: 'N/A',
        trend: 'up',
        icon: 'ShoppingCart',
        hint: 'Payments completed',
      },
      {
        label: 'Active Students',
        value: Number(activeStudents || 0).toLocaleString(),
        delta: 'N/A',
        trend: 'up',
        icon: 'Users',
        hint: 'Unique learners',
      },
      {
        label: 'Published Courses',
        value: publishedCourses.toString(),
        delta: 'N/A',
        trend: 'up',
        icon: 'GraduationCap',
        hint: 'Live in marketplace',
      },
    ];

    // 5. Sales Trend for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEnrollments = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .where('enrollment.status = :status', { status: EnrollmentStatus.COMPLETED })
      .andWhere('enrollment.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .getMany();

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const salesTrendMap = new Map<string, number>();
    days.forEach(d => salesTrendMap.set(d, 0));

    recentEnrollments.forEach(e => {
      const dayName = days[new Date(e.createdAt).getDay()];
      salesTrendMap.set(dayName, salesTrendMap.get(dayName)! + 1);
    });

    const salesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      salesTrend.push({ label: dayName, value: salesTrendMap.get(dayName) || 0 });
    }

    // 6. Top Courses by Revenue
    const topCourseStats = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .select('enrollment.courseId', 'courseId')
      .addSelect('COUNT(enrollment.id)', 'students')
      .addSelect('SUM(enrollment.amount)', 'revenue')
      .where('enrollment.status = :status', { status: EnrollmentStatus.COMPLETED })
      .groupBy('enrollment.courseId')
      .orderBy('revenue', 'DESC')
      .limit(4)
      .getRawMany();

    const topCourses = [];
    for (const stat of topCourseStats) {
      const course = await this.courseRepository.findOne({
        where: { id: stat.courseId },
        relations: ['category']
      });
      if (course) {
        topCourses.push({
          title: course.title,
          category: course.category ? course.category.name : 'Uncategorized',
          price: `$${course.price}`,
          students: Number(stat.students),
          revenue: `$${Number(stat.revenue || 0).toLocaleString()}`,
          rating: 5.0, // Hardcoded since we don't have a review entity
        });
      }
    }

    // 7. Traffic Sources (Mocked as there's no DB tracking for it)
    const sources = [
      { name: 'Organic Search', pct: 42 },
      { name: 'Social Media', pct: 23 },
      { name: 'Affiliates', pct: 18 },
      { name: 'Email', pct: 11 },
      { name: 'Direct', pct: 6 },
    ];

    return {
      kpis,
      salesTrend,
      topCourses,
      sources,
    };
  }
}
