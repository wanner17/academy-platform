# Academy Platform Development Summary

## Current Stack

- Next.js 16 App Router
- React 19
- Prisma 6
- TiDB Cloud MySQL-compatible database
- Auth.js / NextAuth Credentials login
- Tailwind CSS 4

## Environment

- Local env file: `.env.local`
- Required values:
  - `DATABASE_URL`
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_APP_NAME`
- Storage currently uses local filesystem under `public/uploads`.
- Storage abstraction is ready for future Cloudflare R2 migration.

## Auth And Roles

Implemented role split:

- `SUPER_ADMIN`
- `ADMIN`
- `STAFF`
- `TEACHER`
- `STUDENT`

Admin access:

- Admin roles can access full admin pages.
- Teacher role can access teacher-scoped pages only.
- Admin layout redirects unauthorized users to login.

Teacher access:

- `/admin/[slug]/my`
- `/admin/[slug]/profile`
- `/admin/[slug]/programs/[id]`
- `/admin/[slug]/programs/[id]/edit`

Student access:

- `/student/[slug]` — STUDENT role only, same academyId required.
- Other roles are blocked with 403.
- Guard: `requireAcademyStudent` in `authorization.ts`, `requireStudentPage` in `auth/server.ts`.

Logout:

- Admin header has `로그아웃` button.
- Logout redirects to `/admin/login`.

## Demo Accounts

Admin:

- Email: `admin@example.com`
- Password: `password1234`

Teacher:

- Email: `teacher1@example.com`
- Password: `password1234`

Student:

- Email: `student1@example.com`
- Password: `password1234`

## Academy Public Pages

Implemented public pages:

- `/[slug]`
- `/[slug]/programs`
- `/[slug]/programs/[id]`
- `/[slug]/teachers`
- `/[slug]/notices`
- `/[slug]/notices/[id]`
- `/[slug]/contact`

The public schedule menu was removed. Users now see schedules from each class detail page.

## Admin Pages

Implemented admin pages:

- `/admin/login`
- `/admin/[slug]`
- `/admin/[slug]/settings`
- `/admin/[slug]/programs`
- `/admin/[slug]/programs/[id]`
- `/admin/[slug]/programs/[id]/edit`
- `/admin/[slug]/teachers`
- `/admin/[slug]/notices`
- `/admin/[slug]/notices/[id]/edit`
- `/admin/[slug]/inquiries`
- `/admin/[slug]/my`
- `/admin/[slug]/profile`

The standalone schedule menu was removed from navigation. The route still exists, but users are guided through class detail pages.

## Programs / Classes

Implemented class model:

- Title
- Type:
  - `학교별 수업`
  - `수준별 수업`
- Target:
  - `초등`
  - `중등`
  - `고등`
- Subject
- School name
- Grade
- Description
- Assigned teacher
- Public/private state
- Sort order

Behavior:

- Admin can create, update, assign teacher, control public state, and delete classes.
- Teacher can create own classes.
- Teacher-created classes are linked to that teacher automatically.
- Teacher can edit own class basic info.
- Teacher cannot change assigned teacher, public state, or sort order.
- Teacher can delete own classes.
- Class delete also deletes linked schedules in one transaction.

Public behavior:

- Users browse classes by subject.
- Users enter class detail to see class info and schedule.

## Schedules

Implemented schedule model:

- Linked class
- Title
- Subject
- Teacher text
- Room
- Day of week
- Start time
- End time
- Color
- Public state

Behavior:

- Schedules are managed from class detail pages.
- Admin can manage schedules for every class.
- Teacher can manage schedules only for own classes.
- Schedule actions validate ownership server-side.
- Schedule delete has confirmation prompt.

## Teachers

Implemented teacher management:

- Admin can create teachers.
- Admin can connect teacher login account.
- Admin can update teacher name, subject, bio, order, and public state.
- Admin can delete teachers.
- Admin can reset connected teacher account password.

Teacher self-service:

- `/admin/[slug]/profile`
  - Edit own name
  - Edit own subject
  - Edit own bio
  - Change own password
- `/admin/[slug]/my`
  - Add own classes
  - View own classes
  - Delete own classes
  - Open class schedule page

Password rules:

- Teacher account creation requires password length 8+.
- Teacher password reset requires password length 8+.
- Teacher self password change requires current password, new password, and confirmation.

## Notices

Implemented notice features:

- Admin create notice.
- Admin edit notice.
- Admin delete notice.
- Draft / published / archived status.
- Pinned notices.
- Max pinned notices: 3.
- Public notices show only published notices.

Notice attachments:

- Admin can upload multiple files on create.
- Admin can add files on edit.
- Admin can delete individual attachments.
- Public notice detail displays images inline.
- Public notice detail displays non-image files as links.
- Notice delete removes related attachment records and local files.

Current storage:

- Files saved under `public/uploads`.
- File metadata saved in `FileAsset`.

Storage abstraction:

- `StorageProvider`
- `LocalStorageProvider`
- `R2StorageProvider`
- `STORAGE_DRIVER="local"` uses local filesystem.
- `STORAGE_DRIVER="r2"` uses Cloudflare R2.
- R2 uploads use presigned URLs so large files do not pass through Server Actions.
- Upload API route: `/api/admin/[slug]/uploads/presign`.
- Client uploader: `NoticeAttachmentInput`.

## Inquiries

Implemented inquiry features:

- Public contact form.
- Admin inquiry list.
- Admin status/memo update.

Inquiry status:

- `PENDING`
- `IN_PROGRESS`
- `DONE`

## Settings

Implemented academy settings:

- Academy name
- Description
- Phone
- Email
- Address
- Map URL
- Feature toggles

## Storage Design

Current files:

- `src/lib/storage/storage-provider.ts`
- `src/lib/storage/local-storage-provider.ts`
- `src/lib/storage/r2-storage-provider.ts`
- `src/lib/storage/index.ts`
- `src/components/admin/notice-attachment-input.tsx`
- `src/app/api/admin/[slug]/uploads/presign/route.ts`

Provider contract:

- `saveObject`
- `deleteObject`

R2 provider extra behavior:

- Creates presigned PUT URLs.
- Uses `@aws-sdk/client-s3`.
- Uses `@aws-sdk/s3-request-presigner`.
- Stores objects under keys such as `notices/{academyId}/{uuid}-{filename}`.
- Returns `publicUrl` from `R2_PUBLIC_BASE_URL + objectKey`.

Database stores metadata only:

- `objectKey`
- `publicUrl`
- `mimeType`
- `size`
- `purpose`
- `academyId`
- `noticeId`

Cloudflare R2 migration path:

1. Set `STORAGE_DRIVER="r2"`.
2. Set `R2_ACCOUNT_ID`.
3. Set `R2_ACCESS_KEY_ID`.
4. Set `R2_SECRET_ACCESS_KEY`.
5. Set `R2_BUCKET`.
6. Set `R2_PUBLIC_BASE_URL`.

Required R2 env:

```env
STORAGE_DRIVER="r2"
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="..."
R2_PUBLIC_BASE_URL="https://..."
```

R2 CORS required for browser direct PUT:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["content-type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

For production, add the deployed domain to `AllowedOrigins`.

Server Action body limit:

- `next.config.ts` sets `experimental.serverActions.bodySizeLimit = "25mb"`.
- This is fallback only. R2 direct upload avoids sending file bodies through Server Actions.

## Important Security / Authorization Rules

Implemented server-side guards:

- Admin-only pages use `requireAdminPage`.
- Teacher-accessible pages use `requireMemberPage`.
- Teacher class/schedule actions verify ownership server-side.
- Form tampering cannot change teacher assignment, public state, or sort order for teacher edits.
- Notice management is admin-only.
- Presigned upload URL issuance is admin-only.
- Teacher password reset is admin-only.

## Students and Enrollments

Implemented student management (admin only):

- Admin page: `/admin/[slug]/students`
- Create student (name, school, grade, phone, parentPhone, memo, isActive)
- Update student info
- Delete student
- Optional: create login account at creation time (email + password, bcrypt hashed)
- If student already has a login account, email is displayed read-only

Enrollment management (admin only, on same students page):

- Add enrollment: select program from dropdown → assign to student
- Remove enrollment: click button next to program tag
- Status values: `ACTIVE`, `PAUSED`, `ENDED`
- Unique constraint: one student cannot be enrolled in the same program twice

Student model:

- `id`, `academyId`, `userId?` (linked User), `name`, `schoolName`, `grade`, `phone`, `parentPhone`, `memo`, `isActive`

Enrollment model:

- `id`, `academyId`, `studentId` → Student (cascade delete), `programId` → Program (cascade delete), `status`

Student dashboard page:

- `/student/[slug]` — shows student name, school, grade, and list of ACTIVE-enrolled programs
- Each program card shows mode, target level, subject, assigned teacher name
- Empty state: "배정된 수업이 없습니다."

## Homework and Progress Log — Backend Complete, UI Pending

### What is implemented (backend only)

DB models:

- `Homework`: `id`, `academyId`, `programId` → Program (cascade delete), `authorId` → User, `title`, `content` (Text), `dueDate?`, `isVisible`, `createdAt`, `updatedAt`
- `ProgressLog`: `id`, `academyId`, `programId` → Program (cascade delete), `authorId` → User, `classDate`, `content` (Text), `nextPlan?` (Text), `isVisible`, `createdAt`, `updatedAt`
- Both models have composite indexes on `(academyId, programId, createdAt/classDate)` for efficient per-program queries
- User model has `homeworks` and `progressLogs` relations

Repositories:

- `src/lib/repositories/homework.repository.ts`
  - `findByProgram(academyId, programId)` — all records, includes author, ordered by dueDate desc
  - `findVisibleByPrograms(academyId, programIds[])` — visible only, includes program, for student queries
  - `findById(id, academyId)`
  - `create(academyId, data)`
  - `delete(id, academyId)`
- `src/lib/repositories/progress.repository.ts` — same shape as homework repository

Services:

- `src/lib/services/homework.service.ts`
  - `getProgramHomeworks` — for admin/teacher view
  - `getVisibleHomeworksForPrograms` — for student view (isVisible filter)
  - `createHomework` — validates title + content not empty
  - `deleteHomework` — verifies existence first
- `src/lib/services/progress.service.ts` — same shape; also validates classDate is valid Date

### What is NOT implemented yet (UI pending)

- `src/app/(admin)/admin/[slug]/programs/[id]/actions.ts` — no homework/progress server actions yet
- `src/app/(admin)/admin/[slug]/programs/[id]/page.tsx` — no homework/progress UI sections yet (only schedule section)
- `src/app/(student)/student/[slug]/page.tsx` — no homework/progress display yet (only enrollment list)

### Next steps to complete this feature

1. Add `createHomeworkAction`, `deleteHomeworkAction`, `createProgressLogAction`, `deleteProgressLogAction` to program detail actions file
2. Add homework and progress sections to admin program detail page
3. Add homework and progress sections to student dashboard page

## Migrations Added

Existing migration sequence includes:

- `20260519053306_init` — academy/auth/notice/inquiry schema
- `20260519060941_add_teachers`
- `20260519062952_add_programs`
- `20260519064320_add_schedules`
- `20260519074500_link_teachers_programs`
- `20260519083000_add_notice_attachments`
- `20260519090000_add_file_display_name`
- `20260519093000_add_students_enrollments` — Student, Enrollment, STUDENT role
- `20260519100000_add_homework_progress` — Homework, ProgressLog models

Latest migration adds:

- `Homework` table with FK to `Program` (cascade) and `User`
- `ProgressLog` table with FK to `Program` (cascade) and `User`
- Relations added to `User` and `Program` models in schema

## Current Known Tradeoffs

- Local upload storage is development-only. Production should use Cloudflare R2 or equivalent object storage.
- Standalone schedule routes still exist but are not in navigation.
- Notice upload size limit is 10 MB per file.
- Notice upload max count is 5 files per submit.
- R2 presigned upload route currently allows up to 1 GB per file.
- Browser direct upload needs R2 CORS configured.
- Video files can use R2 presigned upload, but streaming UX may need Cloudflare Stream/Mux later.

## Validation Commands

Recently passing:

```bash
npx dotenv -e .env.local -- prisma migrate deploy
npm run prisma:seed
npm run typecheck
npm run lint
npm run build
```

## Suggested Next Work

Immediate (feature in progress):

1. Add homework/progress server actions to `/admin/[slug]/programs/[id]/actions.ts`
2. Add homework/progress UI to admin program detail page
3. Add homework/progress display to student dashboard `/student/[slug]`

Later:

4. Add file upload validation by allowed MIME type.
5. Add admin-side filters for notices, inquiries, teachers, and classes.
6. Add password reset success feedback instead of redirect-only behavior.
7. Add R2 upload progress UI.
8. Add tests around teacher ownership and destructive actions.
