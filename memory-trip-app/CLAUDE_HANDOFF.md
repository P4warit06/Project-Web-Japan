# Memory Trip App — Handoff สำหรับพัฒนาต่อด้วย Claude

## เป้าหมายโปรเจค

สร้างเว็บแอปส่วนตัวสำหรับคู่รัก ใช้เก็บบันทึกความทรงจำจากทริป สถานที่ที่เคยไป รูปภาพ และข้อความสำคัญ พร้อมระบบแชทบอตสำหรับพูดคุยคลายเหงา โดยต้องสามารถเปิดใช้งานผ่าน LINE ได้ในอนาคต

โปรเจคหลักอยู่ที่:

```text
/Users/pawarits/Desktop/Project-Web-Japan/memory-trip-app
```

## สถานะปัจจุบัน

- ใช้ Next.js + TypeScript + React
- ใช้ Prisma เป็น ORM
- มีโครงสร้าง App Router เริ่มต้นแล้ว
- `prisma/schema.prisma` ยังไม่มีโมเดลธุรกิจ
- ยังไม่มีระบบ authentication, รูปภาพ, LINE และ chatbot

ก่อนแก้โค้ด ให้อ่าน `AGENTS.md` ในโปรเจคก่อนเสมอ

## หลักการพัฒนา

1. ทำให้ระบบใช้งานแบบ local ได้ก่อน โดยไม่ต้องพึ่งบริการภายนอก
2. เริ่มด้วย SQLite และ local file storage สำหรับ development
3. แยก logic ตาม feature ไม่รวมทุกอย่างไว้ใน page เดียว
4. ห้ามใส่ secret หรือ API key ลงในโค้ด
5. ข้อมูลรูปภาพและบทสนทนาเป็นข้อมูลส่วนตัว ต้องมีสิทธิ์เข้าถึงและลบข้อมูลได้
6. พัฒนาทีละ milestone และทดสอบหลังจบแต่ละ milestone

## Stack ที่แนะนำ

- Frontend/backend: Next.js App Router + TypeScript
- UI: Tailwind CSS
- Database: Prisma + SQLite ในช่วง development
- Production database: PostgreSQL
- Local image storage: `public/uploads/`
- Production image storage: S3-compatible storage เช่น Cloudflare R2 หรือ Supabase Storage
- LINE: LIFF + LINE Login + Messaging API
- Chatbot: แยกเป็น provider adapter เพื่อเปลี่ยน AI provider ได้ง่าย

## โครงสร้างไฟล์เป้าหมาย

```text
memory-trip-app/
├── app/
│   ├── (liff)/
│   │   ├── page.tsx
│   │   ├── trips/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [tripId]/page.tsx
│   │   ├── memories/page.tsx
│   │   ├── gallery/page.tsx
│   │   ├── places/page.tsx
│   │   ├── chat/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── auth/line/route.ts
│   │   ├── trips/route.ts
│   │   ├── trips/[tripId]/route.ts
│   │   ├── memories/route.ts
│   │   ├── media/route.ts
│   │   ├── chat/sessions/route.ts
│   │   ├── chat/messages/route.ts
│   │   └── line/webhook/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── trip/
│   ├── memory/
│   ├── gallery/
│   └── chat/
├── features/
│   ├── auth/
│   ├── trips/
│   ├── memories/
│   ├── media/
│   ├── couple/
│   └── chatbot/
├── lib/
│   ├── db.ts
│   ├── line/
│   ├── ai/
│   ├── storage/
│   ├── validation/
│   └── security/
├── prisma/
│   └── schema.prisma
├── public/uploads/
├── tests/
├── docs/
├── .env.example
└── README.md
```

## ลำดับการพัฒนา

### Milestone 1 — ทำให้แอปรันและสร้างฐานข้อมูล

1. ตรวจสอบว่า `npm install`, `npm run dev`, `npm run lint` ทำงาน
2. เปลี่ยน Prisma datasource เป็น SQLite สำหรับ local development
3. สร้างโมเดลพื้นฐานและ migration
4. เพิ่ม `lib/db.ts` สำหรับ Prisma client

### Milestone 2 — ระบบคู่รักและข้อมูลทริป

สร้าง CRUD สำหรับ:

- CoupleSpace
- User แบบ local/mock ก่อน
- Trip
- Place
- MemoryEntry

หน้าที่ต้องมี:

- `/trips`
- `/trips/new`
- `/trips/[tripId]`
- `/memories`
- `/places`

### Milestone 3 — ระบบรูปภาพ

1. เพิ่ม `MediaAsset` ใน Prisma
2. สร้าง API อัปโหลดรูป
3. เก็บไฟล์ development ใน `public/uploads/`
4. แสดง gallery และรูปหน้าปกทริป
5. เพิ่มการลบรูปและตรวจสอบชนิด/ขนาดไฟล์

อย่าเก็บ binary รูปภาพไว้ใน PostgreSQL ให้เก็บเฉพาะ metadata และ path/key

### Milestone 4 — UI และ responsive layout

- สร้างหน้า dashboard แสดงทริปล่าสุด
- สร้าง timeline ความทรงจำ
- สร้าง gallery แบบ mobile-first
- เพิ่ม empty state, loading state และ error state
- รองรับการเปิดบนหน้าจอมือถือใน LINE WebView

### Milestone 5 — แชทบอตจำลอง

ก่อนเชื่อม AI จริง ให้ทำบอตแบบ rule-based ก่อน:

- สร้าง ChatSession และ ChatMessage
- ทำหน้า `/chat`
- ตอบข้อความจากชุดคำตอบจำลอง
- บันทึกประวัติข้อความ
- เพิ่มปุ่มล้างประวัติ

### Milestone 6 — เชื่อม AI provider

สร้าง:

- `lib/ai/provider.ts`
- `lib/ai/prompts.ts`
- `lib/ai/memory-context.ts`

ให้ chatbot ใช้เฉพาะข้อมูลที่ผู้ใช้อนุญาต เช่น ชื่อเล่น ทริป และความทรงจำที่เลือกไว้

ต้องแสดงว่าเป็น AI ไม่ใช่แฟนตัวจริง และให้ผู้ใช้ปิดการใช้ memory หรือลบแชทได้

### Milestone 7 — เชื่อม LINE LIFF

ต้องใช้ LINE Developers Console ภายนอกโปรเจค:

1. สร้าง Provider
2. สร้าง LINE Login Channel
3. สร้าง LIFF app
4. กำหนด Endpoint URL
5. เพิ่ม `LINE_CHANNEL_ID`, `LINE_CHANNEL_SECRET`, `LINE_LIFF_ID`
6. ทำหน้า login ด้วย LIFF
7. ส่ง ID token ไปตรวจสอบที่ server
8. ห้ามเชื่อ `userId` จาก client โดยตรง

ช่วงพัฒนา local ต้องใช้ public HTTPS tunnel เช่น Cloudflare Tunnel หรือ ngrok เพื่อให้ LINE เข้าถึงเว็บได้

### Milestone 8 — LINE Official Account และ webhook

ถ้าต้องการรับข้อความจาก LINE แล้วให้บอตตอบกลับ:

- สร้าง Messaging API Channel
- ตั้ง webhook ไปที่ `/api/line/webhook`
- ตรวจสอบ webhook signature ทุกครั้ง
- ประมวลผล event แบบ asynchronous
- อย่าเก็บ channel access token ไว้ฝั่ง client

### Milestone 9 — เตรียม production

- เปลี่ยน SQLite เป็น PostgreSQL
- เปลี่ยน local uploads เป็น object storage
- เพิ่ม rate limiting
- เพิ่ม audit log
- เพิ่ม backup และ export/delete data
- ตั้งค่า environment variables ใน hosting
- ทดสอบบนมือถือจริงและใน LINE จริง

## โมเดลข้อมูลหลัก

โมเดลขั้นต่ำที่ควรมี:

```text
User
- id
- lineUserId (nullable ในช่วง local)
- displayName
- avatarUrl
- createdAt

CoupleSpace
- id
- name
- ownerId
- createdAt

CoupleMember
- id
- coupleSpaceId
- userId
- role

Trip
- id
- coupleSpaceId
- title
- description
- startDate
- endDate
- coverMediaId

Place
- id
- tripId
- name
- latitude
- longitude
- address
- note

MemoryEntry
- id
- tripId
- title
- content
- happenedAt
- mood
- tags

MediaAsset
- id
- coupleSpaceId
- tripId
- memoryEntryId
- storageKey
- thumbnailKey
- mimeType
- width
- height

ChatSession
- id
- coupleSpaceId
- userId
- title
- createdAt

ChatMessage
- id
- sessionId
- role
- content
- model
- createdAt

AiMemory
- id
- coupleSpaceId
- sourceType
- sourceId
- summary
- approvedForChat

AuditLog
- id
- userId
- action
- resourceType
- resourceId
- createdAt
```

## Environment variables

เริ่มจาก `.env.example` และอย่า commit `.env.local`

```env
DATABASE_URL="file:./dev.db"

LINE_CHANNEL_ID=""
LINE_CHANNEL_SECRET=""
LINE_LIFF_ID=""
LINE_CHANNEL_ACCESS_TOKEN=""

AI_PROVIDER="mock"
AI_API_KEY=""
AI_MODEL=""

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Definition of Done สำหรับ MVP

- เปิดเว็บ local ได้จากโฟลเดอร์เดียว
- สร้างและแก้ไขทริปได้
- เพิ่มสถานที่และบันทึกความทรงจำได้
- อัปโหลดและแสดงรูปได้
- มี timeline และ gallery
- มีห้องแชทที่เก็บประวัติได้
- มี chatbot แบบ mock ทำงานได้โดยไม่ต้องมี API key
- มีการตรวจสอบสิทธิ์ระดับ CoupleSpace
- มีปุ่มลบข้อมูลหลัก
- `npm run lint` และ `npm run build` ผ่าน

## ข้อควรระวัง

- ข้อมูลรูปและบทสนทนาเป็นข้อมูลส่วนตัว ห้ามเปิดเป็น public โดยไม่ตั้งใจ
- จำกัดชนิดและขนาดไฟล์รูป
- ตรวจสอบสิทธิ์ทุก API route
- อย่าใส่ secret ใน client component
- อย่าให้ chatbot อ้างว่าเป็นบุคคลจริง
- เพิ่มทางเลือกให้ผู้ใช้ลบ/export ข้อมูล
- หากผู้ใช้พูดถึงการทำร้ายตัวเองหรืออันตราย ต้องหยุด roleplay และแนะนำให้ติดต่อคนใกล้ตัวหรือบริการช่วยเหลือที่เหมาะสม

## คำสั่งสำหรับ Claude ที่รับช่วงต่อ

ให้เริ่มจาก Milestone 1 แล้วทำทีละ milestone ห้ามข้ามไปเชื่อม LINE หรือ AI ก่อนที่ CRUD ของทริปและความทรงจำจะทำงาน

ก่อนแก้ไฟล์ทุกครั้ง:

1. อ่าน `AGENTS.md`
2. ตรวจสอบโครงสร้างไฟล์ปัจจุบัน
3. สรุปไฟล์ที่จะเปลี่ยน
4. แก้ไขแบบเป็นขั้นตอน
5. รัน lint/build หรือการทดสอบที่เกี่ยวข้อง
6. รายงานไฟล์ที่เปลี่ยนและสิ่งที่ยังเหลือ

เป้าหมายแรกที่ควรลงมือทำคือ: ปรับ Prisma เป็น SQLite, เพิ่ม schema สำหรับ User/CoupleSpace/Trip/Place/MemoryEntry/MediaAsset และสร้างหน้า CRUD ของ Trip ให้ใช้งานได้จริง
