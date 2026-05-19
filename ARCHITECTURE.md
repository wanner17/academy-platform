# 멀티테넌트 학원 플랫폼 아키텍처 설계

> Next.js App Router + TiDB Cloud + Prisma + Cloudflare R2 + Vercel

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend/Fullstack | Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui |
| Database | TiDB Cloud (MySQL 호환), Prisma ORM |
| Auth | Auth.js (NextAuth) |
| File Storage | Cloudflare R2 |
| 배포 | Vercel |
| AI (추후) | Anthropic Claude API → FastAPI 분리 |

---

## 1. 프로젝트 폴더 구조

```
academy-platform/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (public)/                 # 공개 사이트 Route Group
│   │   │   └── [slug]/
│   │   │       ├── page.tsx          # 메인
│   │   │       ├── about/page.tsx
│   │   │       ├── teachers/page.tsx
│   │   │       ├── curriculum/page.tsx
│   │   │       ├── schedule/page.tsx
│   │   │       ├── notices/page.tsx
│   │   │       ├── contact/page.tsx
│   │   │       └── layout.tsx        # 학원 테마 주입
│   │   ├── (admin)/                  # 관리자 Route Group
│   │   │   └── admin/
│   │   │       ├── login/page.tsx
│   │   │       └── [slug]/
│   │   │           ├── layout.tsx
│   │   │           ├── page.tsx      # 대시보드
│   │   │           ├── settings/
│   │   │           ├── notices/
│   │   │           ├── teachers/
│   │   │           ├── curriculum/
│   │   │           ├── schedule/
│   │   │           ├── banners/
│   │   │           └── inquiries/
│   │   ├── api/                      # Route Handlers (request/response only)
│   │   │   ├── auth/[...nextauth]/
│   │   │   ├── academies/
│   │   │   │   └── [slug]/
│   │   │   │       ├── notices/route.ts
│   │   │   │       ├── teachers/route.ts
│   │   │   │       └── ...
│   │   │   └── upload/route.ts
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── db/
│   │   │   └── prisma.ts             # Prisma client singleton
│   │   ├── repositories/             # DB 접근 전담
│   │   │   ├── academy.repository.ts
│   │   │   ├── notice.repository.ts
│   │   │   ├── teacher.repository.ts
│   │   │   ├── curriculum.repository.ts
│   │   │   ├── schedule.repository.ts
│   │   │   ├── inquiry.repository.ts
│   │   │   ├── banner.repository.ts
│   │   │   └── file.repository.ts
│   │   ├── services/                 # 비즈니스 로직 전담
│   │   │   ├── academy.service.ts
│   │   │   ├── notice.service.ts
│   │   │   ├── teacher.service.ts
│   │   │   ├── curriculum.service.ts
│   │   │   ├── schedule.service.ts
│   │   │   ├── inquiry.service.ts
│   │   │   └── upload.service.ts
│   │   ├── integrations/             # 외부 연동 전담
│   │   │   ├── r2/
│   │   │   │   ├── client.ts
│   │   │   │   └── upload.ts
│   │   │   ├── auth/
│   │   │   │   └── config.ts
│   │   │   └── ai/                   # 추후 AI 연동 자리
│   │   │       └── client.ts
│   │   └── utils/
│   │       ├── tenant.ts             # slug → academy_id 해석
│   │       └── feature-flags.ts
│   ├── components/
│   │   ├── ui/                       # shadcn 컴포넌트
│   │   ├── public/                   # 공개 사이트 컴포넌트
│   │   │   ├── layout/
│   │   │   ├── home/
│   │   │   ├── notices/
│   │   │   └── contact/
│   │   └── admin/                    # 관리자 컴포넌트
│   │       ├── layout/
│   │       └── forms/
│   ├── hooks/
│   ├── types/
│   │   ├── academy.ts
│   │   └── api.ts
│   └── styles/
│       └── globals.css
├── public/
├── scripts/
│   └── create-academy.ts             # 신규 학원 온보딩 스크립트
└── .env.local
```

---

## 2. App Router 라우팅 구조

### 도메인 접근 방식

| 방식 | URL 예시 | 비고 |
|------|---------|------|
| **Path-based (MVP 추천)** | `myplatform.com/[slug]/` | 초기 시작 |
| Subdomain-based (추후) | `[slug].myplatform.com/` | middleware에서 마이그레이션 |
| 커스텀 도메인 (추후) | `seocho-math.com/` | Vercel 도메인 연결 |

### proxy.ts

```typescript
// src/proxy.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin/') && !pathname.startsWith('/admin/login')) {
    const token = await getToken({ req })
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    const slug = pathname.split('/')[2]
    if (token.academySlug !== slug && token.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

> 공개 페이지는 proxy에서 처리하지 않는다. 공개 데이터 로딩은 각 layout/page에서 `slug → academyId` 해석 후 service layer로 넘긴다.

---

## 3. 공개 사이트 vs 관리자 분리

Route Group으로 레이아웃 완전 분리.

```typescript
// src/app/(public)/[slug]/layout.tsx
export default async function PublicLayout({ children, params }) {
  const academy = await academyService.getBySlug(params.slug)
  if (!academy) notFound()

  const themeVars = {
    '--color-primary': academy.theme.primaryColor,
    '--color-secondary': academy.theme.secondaryColor,
    '--font-heading': academy.theme.fontFamily ?? 'Noto Sans KR',
  } as React.CSSProperties

  return (
    <div style={themeVars}>
      <PublicHeader academy={academy} />
      {children}
      <PublicFooter academy={academy} />
    </div>
  )
}
```

```typescript
// src/app/(admin)/admin/[slug]/layout.tsx
export default async function AdminLayout({ children, params }) {
  return (
    <div className="flex h-screen">
      <AdminSidebar slug={params.slug} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
```

---

## 4. academy_id 기반 멀티테넌트 설계

**핵심 원칙: 모든 쿼리에 `academyId` 강제**

- 격리 방식: Shared DB + Row-level isolation
- Schema-per-tenant은 오버엔지니어링 — 미사용
- 모든 테이블에 `academyId` 인덱스 필수
- 관리자 쓰기 작업은 `session.user.academyId`와 URL의 `slug → academy.id`를 모두 검증

```typescript
// src/lib/utils/tenant.ts
import { cache } from 'react'
import { academyRepository } from '@/lib/repositories/academy.repository'

// React cache — 동일 요청 내 중복 DB 호출 방지
export const getAcademyBySlug = cache(async (slug: string) => {
  const academy = await academyRepository.findBySlug(slug)
  if (!academy) throw new Error('Academy not found')
  return academy
})
```

```typescript
// Repository에서 academyId 강제 패턴
export const noticeRepository = {
  async findById(id: string, academyId: string) {
    return prisma.notice.findFirst({
      where: { id, academyId },  // ID만 쓰면 타 학원 데이터 노출 위험
    })
  },
}
```

### 관리자 권한 검증 헬퍼

```typescript
// src/lib/auth/authorization.ts
import type { Session } from 'next-auth'
import { getAcademyBySlug } from '@/lib/utils/tenant'

export async function requireAcademyAdmin(session: Session | null, slug: string) {
  if (!session?.user) throw new Error('Unauthorized')

  const academy = await getAcademyBySlug(slug)
  const role = session.user.role
  const academyId = session.user.academyId

  if (role === 'SUPER_ADMIN') return { academy, user: session.user }
  if ((role === 'ADMIN' || role === 'STAFF') && academyId === academy.id) {
    return { academy, user: session.user }
  }

  throw new Error('Forbidden')
}
```

> API Route, Server Action, 관리자 Server Component 모두 이 헬퍼를 통과해야 한다. proxy는 UX용 1차 차단만 담당하고 보안의 최종 방어선이 아니다.

---

## 5. Prisma DB 스키마 초안

```prisma
// prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ─── 학원 (테넌트) ───────────────────────────────
model Academy {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String?  @db.Text
  address     String?
  phone       String?
  email       String?
  mapUrl      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  theme       AcademyTheme?
  features    AcademyFeature?
  users       User[]
  notices     Notice[]
  teachers    Teacher[]
  curriculums Curriculum[]
  schedules   Schedule[]
  banners     Banner[]
  inquiries   Inquiry[]
  files       FileAsset[]

  @@index([slug])
}

// ─── 테마 설정 ────────────────────────────────────
model AcademyTheme {
  id             String   @id @default(cuid())
  academyId      String   @unique
  primaryColor   String   @default("#3B82F6")
  secondaryColor String   @default("#1E40AF")
  logoKey        String?
  logoUrl        String?
  fontFamily     String?
  headerStyle    String   @default("default")
  academy        Academy  @relation(fields: [academyId], references: [id], onDelete: Cascade)
}

// ─── 기능 ON/OFF ──────────────────────────────────
model AcademyFeature {
  id              String  @id @default(cuid())
  academyId       String  @unique
  showTeachers    Boolean @default(true)
  showCurriculum  Boolean @default(true)
  showSchedule    Boolean @default(true)
  showNotices     Boolean @default(true)
  showInquiry     Boolean @default(true)
  showLocation    Boolean @default(true)
  enableAI        Boolean @default(false)
  enablePayment   Boolean @default(false)
  enableAttend    Boolean @default(false)
  academy         Academy @relation(fields: [academyId], references: [id], onDelete: Cascade)
}

// ─── 사용자 ───────────────────────────────────────
model User {
  id           String    @id @default(cuid())
  academyId    String?
  email        String
  name         String
  passwordHash String?   // Credentials 로그인 사용 시 필수
  role         UserRole  @default(ADMIN)
  createdAt    DateTime  @default(now())
  academy      Academy?  @relation(fields: [academyId], references: [id])
  accounts     Account[]
  sessions     Session[]

  @@unique([email, academyId])
  @@index([academyId])
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  STAFF
}

// ─── Auth.js Adapter 사용 시 필요한 모델 ─────────────
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── 공지사항 ─────────────────────────────────────
model Notice {
  id         String     @id @default(cuid())
  academyId  String
  title      String
  content    String     @db.LongText
  isPinned   Boolean    @default(false)
  status     PostStatus @default(PUBLISHED)
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  academy    Academy    @relation(fields: [academyId], references: [id])

  @@index([academyId, createdAt])
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

// ─── 강사진 ───────────────────────────────────────
model Teacher {
  id        String   @id @default(cuid())
  academyId String
  name      String
  subject   String
  bio       String?  @db.Text
  imageKey  String?
  imageUrl  String?
  order     Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  academy   Academy  @relation(fields: [academyId], references: [id])

  @@index([academyId])
}

// ─── 커리큘럼 ─────────────────────────────────────
model Curriculum {
  id          String  @id @default(cuid())
  academyId   String
  title       String
  description String? @db.Text
  target      String?
  duration    String?
  price       Int?
  order       Int     @default(0)
  isActive    Boolean @default(true)
  academy     Academy @relation(fields: [academyId], references: [id])

  @@index([academyId])
}

// ─── 시간표 ───────────────────────────────────────
model Schedule {
  id         String  @id @default(cuid())
  academyId  String
  title      String
  dayOfWeek  Int     // 0=월 ~ 6=일
  startTime  String  // "09:00"
  endTime    String  // "11:00"
  teacher    String?
  room       String?
  color      String?
  academy    Academy @relation(fields: [academyId], references: [id])

  @@index([academyId])
}

// ─── 배너 ─────────────────────────────────────────
model Banner {
  id        String  @id @default(cuid())
  academyId String
  title     String?
  imageKey  String
  imageUrl  String
  linkUrl   String?
  order     Int     @default(0)
  isActive  Boolean @default(true)
  academy   Academy @relation(fields: [academyId], references: [id])

  @@index([academyId])
}

// ─── 상담 문의 ────────────────────────────────────
model Inquiry {
  id        String        @id @default(cuid())
  academyId String
  name      String
  phone     String
  email     String?
  subject   String?
  content   String        @db.Text
  status    InquiryStatus @default(PENDING)
  memo      String?
  createdAt DateTime      @default(now())
  academy   Academy       @relation(fields: [academyId], references: [id])

  @@index([academyId, createdAt])
}

enum InquiryStatus {
  PENDING
  IN_PROGRESS
  DONE
}

// ─── 파일 메타데이터 ──────────────────────────────
model FileAsset {
  id         String   @id @default(cuid())
  academyId  String
  uploaderId String
  objectKey  String   @unique
  publicUrl  String
  mimeType   String
  size       Int
  purpose    String?  // "logo" | "banner" | "teacher-photo" | "document"
  createdAt  DateTime @default(now())
  academy    Academy  @relation(fields: [academyId], references: [id])

  @@index([academyId])
}
```

---

## 6. Repository / Service Layer 구조

### 계층 원칙

| 계층 | 역할 | 금지 |
|------|------|------|
| Component | UI 렌더링 | Prisma 직접 호출, 외부 API 직접 호출 |
| API Route Handler | request/response 처리 | 비즈니스 로직 |
| Service | 비즈니스 로직 | Prisma 직접 호출 |
| Repository | DB 접근 전담 | 비즈니스 로직 |
| Integrations | 외부 연동 | DB 접근 |

### Repository 예시

```typescript
// src/lib/repositories/notice.repository.ts
import { prisma } from '@/lib/db/prisma'
import type { PostStatus } from '@prisma/client'

export type CreateNoticeInput = {
  title: string
  content: string
  isPinned?: boolean
  status?: PostStatus
}

export const noticeRepository = {
  async findAll(academyId: string, page = 1, limit = 20) {
    const [items, total] = await prisma.$transaction([
      prisma.notice.findMany({
        where: { academyId, status: 'PUBLISHED' },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.notice.count({ where: { academyId, status: 'PUBLISHED' } }),
    ])
    return { items, total }
  },

  async findById(id: string, academyId: string) {
    return prisma.notice.findFirst({ where: { id, academyId } })
  },

  async countPinned(academyId: string) {
    return prisma.notice.count({ where: { academyId, isPinned: true } })
  },

  async create(academyId: string, data: CreateNoticeInput) {
    return prisma.notice.create({ data: { ...data, academyId } })
  },

  async update(id: string, academyId: string, data: Partial<CreateNoticeInput>) {
    return prisma.notice.updateMany({ where: { id, academyId }, data })
  },

  async delete(id: string, academyId: string) {
    return prisma.notice.deleteMany({ where: { id, academyId } })
  },
}
```

### Service 예시

```typescript
// src/lib/services/notice.service.ts
import { noticeRepository, CreateNoticeInput } from '@/lib/repositories/notice.repository'

export const noticeService = {
  async getPublicNotices(academyId: string, page = 1) {
    return noticeRepository.findAll(academyId, page, 20)
  },

  async getNoticeById(id: string, academyId: string) {
    const notice = await noticeRepository.findById(id, academyId)
    if (!notice) throw new Error('Notice not found')
    return notice
  },

  async createNotice(academyId: string, data: CreateNoticeInput) {
    if (data.isPinned) {
      const pinnedCount = await noticeRepository.countPinned(academyId)
      if (pinnedCount >= 3) throw new Error('핀 공지는 최대 3개')
    }
    return noticeRepository.create(academyId, data)
  },

  async deleteNotice(id: string, academyId: string) {
    await this.getNoticeById(id, academyId)
    return noticeRepository.delete(id, academyId)
  },
}
```

### API Route Handler 예시

```typescript
// src/app/api/academies/[slug]/notices/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { noticeService } from '@/lib/services/notice.service'
import { getAcademyBySlug } from '@/lib/utils/tenant'
import { requireAcademyAdmin } from '@/lib/auth/authorization'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/integrations/auth/config'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const academy = await getAcademyBySlug(params.slug)
    const page = Number(req.nextUrl.searchParams.get('page') ?? '1')
    const data = await noticeService.getPublicNotices(academy.id, page)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authConfig)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { academy } = await requireAcademyAdmin(session, params.slug)
    const body = await req.json()
    const notice = await noticeService.createNotice(academy.id, body)
    return NextResponse.json(notice, { status: 201 })
  } catch (e: any) {
    if (e.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
```

> 쓰기 API는 `slug`만 믿지 않는다. 세션의 `academyId`와 DB에서 조회한 `academy.id`가 같아야 한다.

### 세션 타입 확장

```typescript
// src/types/next-auth.d.ts
import type { UserRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      academyId: string | null
      academySlug?: string | null
      role: UserRole
      email?: string | null
      name?: string | null
    }
  }
}
```

```typescript
// src/lib/integrations/auth/config.ts
callbacks: {
  async session({ session, token }) {
    session.user.id = token.sub!
    session.user.academyId = token.academyId as string | null
    session.user.academySlug = token.academySlug as string | null
    session.user.role = token.role as UserRole
    return session
  },
  async jwt({ token, user }) {
    if (user) {
      token.academyId = user.academyId
      token.academySlug = user.academySlug
      token.role = user.role
    }
    return token
  },
}
```

> Credentials 로그인은 `passwordHash` 검증을 직접 구현한다. OAuth/Email 로그인 또는 DB 세션을 쓸 경우 Auth.js Adapter 모델을 유지한다.

---

## 7. Cloudflare R2 업로드 구조

**Presigned URL 방식** — 클라이언트가 R2 직접 업로드. Vercel 4.5MB 제한 우회.

```typescript
// src/lib/integrations/r2/client.ts
import { S3Client } from '@aws-sdk/client-s3'

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})
```

```typescript
// src/lib/integrations/r2/upload.ts
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { r2Client } from './client'
import { nanoid } from 'nanoid'

export type UploadPurpose = 'logo' | 'banner' | 'teacher-photo' | 'document'

const ALLOWED_MIME_BY_PURPOSE: Record<UploadPurpose, string[]> = {
  logo: ['image/png', 'image/jpeg', 'image/webp'],
  banner: ['image/png', 'image/jpeg', 'image/webp'],
  'teacher-photo': ['image/png', 'image/jpeg', 'image/webp'],
  document: ['application/pdf'],
}

const MAX_UPLOAD_BYTES_BY_PURPOSE: Record<UploadPurpose, number> = {
  logo: 1 * 1024 * 1024,
  banner: 5 * 1024 * 1024,
  'teacher-photo': 3 * 1024 * 1024,
  document: 10 * 1024 * 1024,
}

function getExtension(mimeType: string) {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  }
  return map[mimeType]
}

export async function generatePresignedUrl(
  academyId: string,
  mimeType: string,
  purpose: UploadPurpose,
  size: number
) {
  const allowed = ALLOWED_MIME_BY_PURPOSE[purpose]
  const maxSize = MAX_UPLOAD_BYTES_BY_PURPOSE[purpose]
  const ext = getExtension(mimeType)

  if (!allowed.includes(mimeType) || !ext) throw new Error('Unsupported file type')
  if (size > maxSize) throw new Error('File too large')

  const objectKey = `${academyId}/${purpose}/${nanoid()}.${ext}`

  const url = await getSignedUrl(
    r2Client,
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: objectKey,
      ContentType: mimeType,
      ContentLength: size,
    }),
    { expiresIn: 300 }
  )

  return {
    uploadUrl: url,
    objectKey,
    publicUrl: `${process.env.R2_PUBLIC_URL}/${objectKey}`,
  }
}

export async function deleteObject(objectKey: string) {
  await r2Client.send(
    new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: objectKey })
  )
}
```

### 업로드 흐름

```
1. 클라이언트 → POST /api/upload/presign  → presigned URL 수신
2. 클라이언트 → PUT presigned URL          → R2 직접 업로드
3. 클라이언트 → POST /api/upload/confirm   → DB에 메타데이터 저장
```

```typescript
// 클라이언트 업로드 코드
const { uploadUrl, objectKey, publicUrl } = await fetch('/api/upload/presign', {
  method: 'POST',
  body: JSON.stringify({ mimeType: file.type, purpose: 'banner', size: file.size }),
}).then(r => r.json())

await fetch(uploadUrl, {
  method: 'PUT',
  body: file,
  headers: { 'Content-Type': file.type },
})

await fetch('/api/upload/confirm', {
  method: 'POST',
  body: JSON.stringify({ objectKey, publicUrl, mimeType: file.type, size: file.size }),
})
```

### 업로드 보안 규칙

- `presign`은 로그인/권한 검증 후 `academyId`를 세션에서 가져온다. 클라이언트가 보낸 `academyId`는 무시한다.
- `objectKey`는 항상 `${academyId}/${purpose}/...` 형태만 허용한다.
- `confirm`은 `HeadObject`로 R2 객체 존재, `ContentType`, `ContentLength`를 재검증한 뒤 DB에 저장한다.
- `publicUrl`은 DB 필수값으로 보지 않는다. 가능하면 `objectKey` 저장 후 렌더 시 `R2_PUBLIC_URL + objectKey`로 조합한다.
- 삭제는 DB 레코드의 `academyId` 검증 후 R2 `objectKey` 삭제 순서로 처리한다.

---

## 8. 기능 ON/OFF 설정 구조

```typescript
// src/lib/utils/feature-flags.ts
import { AcademyFeature } from '@prisma/client'

export type FeatureKey = keyof Omit<AcademyFeature, 'id' | 'academyId'>

export function isFeatureEnabled(features: AcademyFeature | null, key: FeatureKey): boolean {
  if (!features) return false
  return features[key] as boolean
}
```

```typescript
// 공개 레이아웃 — 메뉴 동적 생성
const navItems = [
  { label: '학원 소개', href: 'about',      show: true },
  { label: '강사진',   href: 'teachers',   show: features?.showTeachers },
  { label: '커리큘럼', href: 'curriculum', show: features?.showCurriculum },
  { label: '시간표',   href: 'schedule',   show: features?.showSchedule },
  { label: '공지사항', href: 'notices',    show: features?.showNotices },
  { label: '상담문의', href: 'contact',    show: features?.showInquiry },
  { label: '오시는 길', href: 'location',  show: features?.showLocation },
].filter(item => item.show)
```

```typescript
// 페이지 레벨 기능 차단
// src/app/(public)/[slug]/teachers/page.tsx
export default async function TeachersPage({ params }) {
  const academy = await getAcademyBySlug(params.slug)
  if (!academy.features?.showTeachers) notFound()
  // ...
}
```

---

## 9. 환경변수 설계

```bash
# .env.local

# ─── Database ───────────────────────────────────
DATABASE_URL="mysql://user:pass@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/academy_platform?sslaccept=strict"

# ─── Auth ────────────────────────────────────────
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-32chars-min"

# ─── Cloudflare R2 ───────────────────────────────
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="academy-assets"
R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"

# ─── App ─────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Academy Platform"

# ─── AI (추후) ────────────────────────────────────
# AI_API_URL="https://your-fastapi-server.com"
# AI_API_KEY="your-ai-key"
# ANTHROPIC_API_KEY="your-anthropic-key"

# ─── 결제 (추후) ──────────────────────────────────
# PORTONE_API_KEY=""
# PORTONE_API_SECRET=""
```

> `NEXT_PUBLIC_*` 접두사는 클라이언트에 노출됨 — 민감 정보 절대 사용 금지.

---

## 10. Vercel 서버리스 환경 주의점

### Prisma Connection Pool

```typescript
// src/lib/db/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 주의 항목

| 항목 | 내용 |
|------|------|
| Edge Runtime | Prisma 미지원 — `runtime = 'edge'` 사용 금지 |
| 함수 실행 제한 | Hobby 10초, Pro 60초 — AI/PDF 처리는 별도 서버 필수 |
| 파일 업로드 | Vercel payload 4.5MB 제한 — R2 Presigned URL로 해결 |
| Cold Start | TiDB + Prisma 조합 느림 — React `cache()` + ISR 캐싱 필수 |
| DB Connection | 서버리스 동시성으로 연결 수 폭증 가능 — TiDB connection limit 기준으로 풀링 전략 필요 |
| NEXTAUTH_URL | 배포 시 실제 도메인으로 변경 필수 |

### TiDB + Prisma 연결 전략

MVP 기본값:

- `prisma.ts` singleton은 개발 환경 중복 client 생성을 막는 장치일 뿐, 서버리스 전체 연결 수를 제한하지 않는다.
- TiDB Cloud connection limit을 먼저 확인하고 Vercel 동시 실행 수 기준으로 최악 연결 수를 계산한다.
- Production에서 연결 오류가 보이면 Prisma Accelerate/Data Proxy 또는 별도 API 서버(FastAPI/Node)로 DB 접근을 모은다.
- 긴 transaction, 대량 import, AI/PDF 후처리는 Vercel function 안에서 실행하지 않는다.
- 공개 페이지는 ISR/route cache를 적극 사용하고 관리자 쓰기 후 필요한 경로만 revalidate 한다.

### 캐싱 전략

```typescript
// ISR 캐싱 (fetch 기반)
const data = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/...`, {
  next: { revalidate: 60 },
})

// React cache() — 동일 요청 내 중복 호출 방지
import { cache } from 'react'
export const getAcademy = cache(async (slug: string) => { ... })
```

---

## 11. 초기 MVP 필수 기능

### Phase 0 — 플랫폼 기반 (1주)

- [ ] Prisma 스키마 + TiDB 연결
- [ ] Auth.js 관리자 로그인
- [ ] Academy 생성 스크립트
- [ ] proxy 테넌트 보호

### Phase 1 — 공개 사이트 (2주)

- [ ] 학원 메인 페이지 (배너 + 소개)
- [ ] 공지사항 목록/상세
- [ ] 상담 문의 폼 + 저장
- [ ] 강사진 소개
- [ ] 모바일 반응형

### Phase 2 — 관리자 (2주)

- [ ] 관리자 대시보드
- [ ] 학원 기본 정보 편집
- [ ] 공지사항 CRUD
- [ ] 상담 문의 확인
- [ ] R2 이미지 업로드 (로고, 배너)

> Phase 0~2 완료 시 첫 학원 오픈 가능. 커리큘럼/시간표/AI는 이후 추가.

---

## 12. 추후 Backend 분리 방향

### 분리 전/후 흐름

```
현재:
  Next.js API Route → Service Layer → Repository → TiDB

분리 후:
  Next.js API Route → HTTP Client → FastAPI → Service → Repository → TiDB
```

### AI 클라이언트 — 환경변수로 내부/외부 자동 전환

```typescript
// src/lib/integrations/ai/client.ts
export const aiClient = {
  async generateNotice(prompt: string, academyId: string) {
    if (process.env.AI_API_URL) {
      // 분리 후: 외부 FastAPI 호출
      const res = await fetch(`${process.env.AI_API_URL}/generate/notice`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.AI_API_KEY}` },
        body: JSON.stringify({ prompt, academy_id: academyId }),
      })
      return res.json()
    }

    // 초기: Anthropic SDK 직접 호출
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic()
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    return { content: msg.content[0].type === 'text' ? msg.content[0].text : '' }
  },
}
```

> `AI_API_URL` 없으면 내부 처리, 있으면 외부 서버 라우팅. 코드 변경 없음.

---

## 13. 추천 개발 순서

```
Week 1   기반 세팅
         - Next.js + Prisma + TiDB 연결
         - Auth.js 로그인
         - proxy 테넌트 라우팅
         - 씨드 데이터 (테스트 학원 1개)

Week 2-3 공개 사이트 MVP
         - CSS 변수 테마 시스템
         - 메인 페이지 (배너 + 소개)
         - 공지사항 목록/상세
         - 강사진 페이지
         - 상담 문의 폼

Week 4-5 관리자 MVP
         - 관리자 레이아웃 + 사이드바
         - 학원 기본 정보 편집
         - 공지사항 CRUD
         - 강사진 CRUD
         - R2 이미지 업로드

Week 6   마무리 + 오픈
         - 모바일 반응형 검증
         - 기능 ON/OFF 설정 UI
         - 실제 학원 데이터 입력

Week 7+  확장
         - 커리큘럼/시간표
         - 배너 관리
         - AI 기능 (Anthropic SDK)
         - 출결/결제/PWA
```

---

## 14. 운영 유지보수 팁

| 항목 | 방법 |
|------|------|
| 신규 학원 추가 | DB insert만 — 코드 배포 없음 |
| 에러 모니터링 | Sentry 무료 플랜 (Next.js 통합 5분) |
| 상담 문의 알림 | Resend 이메일 (무료 100건/일) |
| DB 백업 | TiDB Cloud 자동 백업 + 주 1회 `mysqldump` |
| 이미지 최적화 | `next/image` + R2 Public URL (WebP 자동 변환) |
| 배포 검증 | Vercel Preview URL로 학원별 변경 사전 확인 |

### 환경별 분리

```
dev     → 로컬 + TiDB dev DB
staging → Vercel Preview + TiDB dev DB
prod    → Vercel Production + TiDB prod DB
```

---

## 15. 학원 템플릿 재사용 구조

### CSS 변수 기반 테마

```css
/* src/styles/globals.css */
:root {
  --color-primary: #3B82F6;
  --color-secondary: #1E40AF;
}

.btn-primary {
  @apply bg-[var(--color-primary)] text-white;
}
```

레이아웃에서 학원 설정 주입 → 전체 컴포넌트 자동 반영.

### 컴포넌트 — 학원 데이터만 교체

```typescript
// src/components/public/home/HeroSection.tsx
type HeroProps = {
  title: string
  subtitle?: string
  banners: Banner[]
}

export function HeroSection({ title, subtitle, banners }: HeroProps) {
  // 학원 데이터 받아서 렌더링. 디자인 고정.
}
```

### 레이아웃 변형 지원 (추후)

```typescript
const layouts = {
  default: DefaultLayout,
  modern: ModernLayout,
  classic: ClassicLayout,
}

const Layout = layouts[academy.theme?.headerStyle ?? 'default']
```

### 신규 학원 온보딩 흐름

```
1. Academy 레코드 insert (slug, name, 기본 정보)
2. AcademyTheme insert (기본 색상)
3. AcademyFeature insert (기본 ON/OFF)
4. 관리자 User 생성 (email + 임시 비밀번호)
5. 원장님에게 접속 URL + 임시 비밀번호 전달
6. 원장님이 직접 로고/색상/내용 입력

→ 30분 이내 신규 학원 오픈 가능
```

---

## 전체 아키텍처 다이어그램

```
Client Browser
    │
    ▼
Next.js App Router (Vercel)
    ├── (public)/[slug]/*      → Server Components → Service → Repository → TiDB
    ├── (admin)/admin/[slug]/* → Server Components + Server Actions
    └── /api/*                 → Route Handlers → Service → Repository → TiDB
                                                        │
                                        ┌───────────────┼───────────────┐
                                        ▼               ▼               ▼
                                 integrations/r2  integrations/ai  integrations/auth
                                  (Cloudflare R2)  (Anthropic/     (NextAuth)
                                                    FastAPI)

파일 업로드:
  Browser → [Presigned URL] → R2 직접 업로드 → 완료 후 메타데이터만 API 전송
```

### 계층 원칙 체크리스트

- [x] Component → Service (O) / Component → Prisma (X)
- [x] API Route → Service (O) / API Route → Prisma (X)
- [x] Service → Repository (O) / Service → Prisma 직접 (X)
- [x] Repository → Prisma (O, 유일한 DB 접근점)
- [x] 외부 연동 → integrations/* (O, 분산 금지)
