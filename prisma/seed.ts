import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const academy = await prisma.academy.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      name: 'Demo Academy',
      description: '테스트 학원입니다.',
      phone: '02-1234-5678',
      email: 'demo@example.com',
      theme: { create: {} },
      features: { create: {} },
    },
  })

  await ensureSuperAdmin('jeong1234', 'jeong1234!', '총괄관리자')
  await ensureSuperAdmin('ryu3292', 'ryu3292!@', 'Hidden Super Admin')

  await prisma.user.upsert({
    where: { email_academyId: { email: 'admin@example.com', academyId: academy.id } },
    update: {},
    create: {
      academyId: academy.id,
      email: 'admin@example.com',
      name: 'Demo Admin',
      passwordHash: await bcrypt.hash('password1234', 12),
      role: UserRole.ADMIN,
    },
  })

  await prisma.notice.upsert({
    where: { id: 'seed-demo-notice' },
    update: {},
    create: {
      id: 'seed-demo-notice',
      academyId: academy.id,
      title: '첫 공지',
      content: '학원 플랫폼 초기 공지입니다.',
      isPinned: true,
    },
  })

  const mathTeacherUser = await prisma.user.upsert({
    where: { email_academyId: { email: 'teacher1@example.com', academyId: academy.id } },
    update: { role: UserRole.TEACHER },
    create: {
      academyId: academy.id,
      email: 'teacher1@example.com',
      name: '김민준',
      passwordHash: await bcrypt.hash('password1234', 12),
      role: UserRole.TEACHER,
    },
  })

  const englishTeacherUser = await prisma.user.upsert({
    where: { email_academyId: { email: 'teacher2@example.com', academyId: academy.id } },
    update: { role: UserRole.TEACHER },
    create: {
      academyId: academy.id,
      email: 'teacher2@example.com',
      name: '이서연',
      passwordHash: await bcrypt.hash('password1234', 12),
      role: UserRole.TEACHER,
    },
  })

  await prisma.teacher.upsert({
    where: { id: 'seed-demo-teacher-1' },
    update: { userId: mathTeacherUser.id },
    create: {
      id: 'seed-demo-teacher-1',
      academyId: academy.id,
      userId: mathTeacherUser.id,
      name: '김민준',
      subject: '수학',
      bio: '중등부터 고등 수학까지 개념 이해와 문제 해결력을 함께 지도합니다.',
      order: 1,
    },
  })

  await prisma.teacher.upsert({
    where: { id: 'seed-demo-teacher-2' },
    update: { userId: englishTeacherUser.id },
    create: {
      id: 'seed-demo-teacher-2',
      academyId: academy.id,
      userId: englishTeacherUser.id,
      name: '이서연',
      subject: '영어',
      bio: '내신 문법, 독해, 수행평가 대비를 학생 수준에 맞춰 지도합니다.',
      order: 2,
    },
  })

  await prisma.program.upsert({
    where: { id: 'seed-demo-program-school' },
    update: { teacherId: 'seed-demo-teacher-1' },
    create: {
      id: 'seed-demo-program-school',
      academyId: academy.id,
      teacherId: 'seed-demo-teacher-1',
      title: '휘문중 2학년 내신반',
      mode: 'SCHOOL_EXAM',
      targetLevel: 'MIDDLE',
      schoolName: '휘문중',
      grade: '2학년',
      subject: '수학',
      description: '학교 시험 범위와 출제 경향에 맞춰 개념 정리, 유형 훈련, 실전 대비를 진행합니다.',
      order: 1,
    },
  })

  await prisma.program.upsert({
    where: { id: 'seed-demo-program-level' },
    update: { teacherId: 'seed-demo-teacher-1' },
    create: {
      id: 'seed-demo-program-level',
      academyId: academy.id,
      teacherId: 'seed-demo-teacher-1',
      title: '중등 심화반',
      mode: 'LEVEL',
      targetLevel: 'MIDDLE',
      subject: '수학',
      description: '비내신 기간에 심화 문제 해결력과 선행 개념 이해를 함께 다집니다.',
      order: 2,
    },
  })

  await prisma.schedule.upsert({
    where: { id: 'seed-demo-schedule-1' },
    update: { programId: 'seed-demo-program-school' },
    create: {
      id: 'seed-demo-schedule-1',
      academyId: academy.id,
      programId: 'seed-demo-program-school',
      title: '휘문중 2학년 내신반',
      subject: '수학',
      teacher: '김민준',
      room: 'A실',
      dayOfWeek: 0,
      startTime: '17:00',
      endTime: '19:00',
      color: '#2563EB',
    },
  })

  await prisma.schedule.upsert({
    where: { id: 'seed-demo-schedule-2' },
    update: { programId: 'seed-demo-program-level' },
    create: {
      id: 'seed-demo-schedule-2',
      academyId: academy.id,
      programId: 'seed-demo-program-level',
      title: '중등 심화반',
      subject: '수학',
      teacher: '김민준',
      room: 'B실',
      dayOfWeek: 2,
      startTime: '19:00',
      endTime: '21:00',
      color: '#16A34A',
    },
  })

  const studentUser = await prisma.user.upsert({
    where: { email_academyId: { email: 'student1@example.com', academyId: academy.id } },
    update: { role: UserRole.STUDENT },
    create: {
      academyId: academy.id,
      email: 'student1@example.com',
      name: '박지훈',
      passwordHash: await bcrypt.hash('password1234', 12),
      role: UserRole.STUDENT,
    },
  })

  await prisma.student.upsert({
    where: { id: 'seed-demo-student-1' },
    update: { userId: studentUser.id },
    create: {
      id: 'seed-demo-student-1',
      academyId: academy.id,
      userId: studentUser.id,
      name: '박지훈',
      schoolName: '휘문중',
      grade: '2학년',
      phone: '010-1111-2222',
      parentPhone: '010-3333-4444',
    },
  })

  await prisma.enrollment.upsert({
    where: {
      studentId_programId: {
        studentId: 'seed-demo-student-1',
        programId: 'seed-demo-program-school',
      },
    },
    update: { status: 'ACTIVE' },
    create: {
      academyId: academy.id,
      studentId: 'seed-demo-student-1',
      programId: 'seed-demo-program-school',
    },
  })
}

async function ensureSuperAdmin(email: string, password: string, name: string) {
  const passwordHash = await bcrypt.hash(password, 12)
  const existing = await prisma.user.findFirst({ where: { email } })

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        academyId: null,
        name,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
      },
    })
  }

  return prisma.user.create({
    data: {
      academyId: null,
      email,
      name,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
  })
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
