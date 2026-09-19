import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CategoryService } from './category/category.service';
import { CourseService } from './course/course.service';
import { UsersService } from './users/users.service';
import { UserRole } from './users/entities/user.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const categoryService = app.get(CategoryService);
  const courseService = app.get(CourseService);
  const usersService = app.get(UsersService);

  console.log('--- Starting Database Seeding ---');

  // 1. Seed Super Admin User if not present
  try {
    const existingAdmin = await usersService.findByEmail('admin@edunova.com');
    if (!existingAdmin) {
      await usersService.create({
        name: 'Super Admin',
        email: 'admin@edunova.com',
        password: 'Admin@123456',
        role: UserRole.ADMIN,
      } as any);
      console.log('Created Super Admin: admin@edunova.com / Admin@123456');
    }
  } catch (e) {
    console.log('Admin user check/seed:', e.message);
  }

  // 2. Seed Categories
  const initialCategories = [
    {
      name: 'Web Development',
      description: 'Master React, Next.js, Node.js, and modern fullstack web technologies.',
    },
    {
      name: 'Artificial Intelligence & ML',
      description: 'Learn Neural Networks, PyTorch, LLMs, Computer Vision, and Applied AI.',
    },
    {
      name: 'Cloud & DevOps',
      description: 'Docker, Kubernetes, AWS, Terraform, CI/CD pipelines and microservices.',
    },
    {
      name: 'Cybersecurity',
      description: 'Ethical hacking, network security, penetration testing, and zero trust.',
    },
    {
      name: 'Data Engineering',
      description: 'Big Data, Apache Spark, Snowflake, SQL analytics, and data warehousing.',
    },
  ];

  const createdCategories: any[] = [];
  for (const cat of initialCategories) {
    try {
      const created = await categoryService.create(cat as any);
      createdCategories.push(created);
      console.log(`Created Category: ${created.name}`);
    } catch (e) {
      console.log(`Category "${cat.name}" already exists.`);
    }
  }

  // Fetch all categories if some already existed
  const allCatRes = await categoryService.findAll({ limit: 50 });
  const categoryMap = new Map<string, number>();
  allCatRes.items.forEach((c) => categoryMap.set(c.name, c.id));

  // 3. Seed Production Quality Courses
  const initialCourses = [
    {
      title: 'Fullstack Next.js 14 & Node.js Microservices Masterclass',
      description: 'Build enterprise-grade fullstack web applications with React, Next.js 14 Server Actions, PostgreSQL, Redis, and TailwindCSS.',
      price: 120,
      discountPrice: 89,
      categoryName: 'Web Development',
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=700&q=85',
      isPublished: true,
      metadata: {
        level: 'Advanced',
        duration: '42 Hours',
        potential: '$10k+/mo Potential',
        rating: 4.9,
        reviews: '1.4k',
      },
    },
    {
      title: 'Applied Generative AI & LLM Engineering with PyTorch',
      description: 'Train custom LLMs, build RAG pipelines with LangChain & LlamaIndex, fine-tune models on GPU clusters, and deploy AI agents.',
      price: 150,
      discountPrice: 110,
      categoryName: 'Artificial Intelligence & ML',
      thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=700&q=85',
      isPublished: true,
      metadata: {
        level: 'Expert',
        duration: '50 Hours',
        potential: '$12k+/mo Potential',
        rating: 5.0,
        reviews: '2.1k',
      },
    },
    {
      title: 'Cloud DevOps Architecture: Kubernetes & Terraform',
      description: 'Master production infrastructure provisioning, GitOps with ArgoCD, Docker container orchestration, Prometheus monitoring, and AWS EKS.',
      price: 110,
      discountPrice: 79,
      categoryName: 'Cloud & DevOps',
      thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=700&q=85',
      isPublished: true,
      metadata: {
        level: 'Intermediate',
        duration: '36 Hours',
        potential: '$9.5k/mo Potential',
        rating: 4.8,
        reviews: '980',
      },
    },
    {
      title: 'Ethical Hacking & Advanced Penetration Testing 2026',
      description: 'Hands-on cybersecurity Bootcamp covering network exploitation, web application security testing, privilege escalation, and OSCP prep.',
      price: 130,
      discountPrice: 95,
      categoryName: 'Cybersecurity',
      thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=700&q=85',
      isPublished: true,
      metadata: {
        level: 'All Levels',
        duration: '38 Hours',
        potential: '$8.5k/mo Potential',
        rating: 4.9,
        reviews: '1.1k',
      },
    },
  ];

  for (const course of initialCourses) {
    try {
      const catId = categoryMap.get(course.categoryName);
      await courseService.create({
        title: course.title,
        description: course.description,
        price: course.price,
        discountPrice: course.discountPrice,
        thumbnail: course.thumbnail,
        isPublished: course.isPublished,
        categoryId: catId,
        metadata: course.metadata,
      } as any);
      console.log(`Created Course: ${course.title}`);
    } catch (e) {
      console.log(`Course error: ${e.message}`);
    }
  }

  console.log('--- Database Seeding Complete ---');
  await app.close();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
