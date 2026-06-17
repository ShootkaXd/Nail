import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminHash = await bcrypt.hash('admin123', 10)
  const masterHash = await bcrypt.hash('master123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@nail.local' },
    update: {},
    create: { name: 'Администратор', email: 'admin@nail.local', passwordHash: adminHash, role: 'admin' },
  })
  console.log('Admin created:', admin.email)

  const services = await Promise.all([
    prisma.service.upsert({ where: { id: 1 }, update: {}, create: { name: 'Классический маникюр', description: 'Обработка ногтей, покрытие лаком', category: 'Маникюр', durationMinutes: 60, price: 1200 } }),
    prisma.service.upsert({ where: { id: 2 }, update: {}, create: { name: 'Гель-лак маникюр', description: 'Маникюр с покрытием гель-лаком', category: 'Маникюр', durationMinutes: 90, price: 1800 } }),
    prisma.service.upsert({ where: { id: 3 }, update: {}, create: { name: 'Наращивание ногтей', description: 'Наращивание на формах или типсах', category: 'Наращивание', durationMinutes: 120, price: 2500 } }),
    prisma.service.upsert({ where: { id: 4 }, update: {}, create: { name: 'Педикюр классический', description: 'Обработка стоп и ногтей', category: 'Педикюр', durationMinutes: 75, price: 1500 } }),
    prisma.service.upsert({ where: { id: 5 }, update: {}, create: { name: 'Нейл-арт', description: 'Художественный дизайн ногтей', category: 'Дизайн', durationMinutes: 30, price: 500 } }),
  ])
  console.log('Services created:', services.length)

  const [s1, s2, s3, s4, s5] = services

  let master1 = await prisma.user.findUnique({ where: { email: 'anna@nail.local' } })
  if (!master1) {
    master1 = await prisma.user.create({
      data: {
        name: 'Анна Смирнова',
        email: 'anna@nail.local',
        phone: '+7 900 111 2233',
        passwordHash: masterHash,
        role: 'master',
        masterProfile: {
          create: {
            bio: 'Мастер маникюра с 5-летним опытом. Специализируюсь на гель-лаке и нейл-арте.',
            masterServices: {
              create: [{ serviceId: s1.id }, { serviceId: s2.id }, { serviceId: s5.id }],
            },
          },
        },
      },
    })
  }

  let master2 = await prisma.user.findUnique({ where: { email: 'maria@nail.local' } })
  if (!master2) {
    master2 = await prisma.user.create({
      data: {
        name: 'Мария Козлова',
        email: 'maria@nail.local',
        phone: '+7 900 444 5566',
        passwordHash: masterHash,
        role: 'master',
        masterProfile: {
          create: {
            bio: 'Универсальный мастер. Делаю маникюр, педикюр и наращивание.',
            masterServices: {
              create: [{ serviceId: s1.id }, { serviceId: s2.id }, { serviceId: s3.id }, { serviceId: s4.id }],
            },
          },
        },
      },
    })
  }
  console.log('Masters created:', master1.email, master2.email)

  const days = [1, 2, 3, 4, 5] // Mon-Fri
  for (const masterId of [master1.id, master2.id]) {
    await prisma.workingHour.deleteMany({ where: { masterId } })
    await prisma.workingHour.createMany({
      data: days.map((d) => ({ masterId, dayOfWeek: d, startTime: '09:00', endTime: '18:00', isActive: true })),
    })
  }
  // Add Saturday for master1
  await prisma.workingHour.create({
    data: { masterId: master1.id, dayOfWeek: 6, startTime: '10:00', endTime: '16:00', isActive: true },
  })
  console.log('Working hours created')

  const existingPromos = await prisma.promotion.count()
  if (existingPromos === 0) {
    await prisma.promotion.createMany({
      data: [
        { name: 'Летняя скидка 15%', serviceId: null, discountPercent: 15, startDate: new Date('2026-06-01'), endDate: new Date('2026-08-31'), isActive: true },
        { name: 'Скидка на наращивание 20%', serviceId: s3.id, discountPercent: 20, startDate: new Date('2026-06-01'), endDate: new Date('2026-07-31'), isActive: true },
      ],
    })
  }
  console.log('Promotions created')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
