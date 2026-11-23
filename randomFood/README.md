# Food Roulette — Smart Food Discovery Platform

แพลตฟอร์มช่วยตัดสินใจมื้ออาหารที่ **สุ่มเมนูอาหารตามเงื่อนไข** จากนั้น **ค้นหาร้านอาหารจริงที่ขายเมนูนั้นใกล้ผู้ใช้** พร้อมรีวิว คะแนน ราคา ระยะทาง แผนที่ และลิงก์สั่งอาหาร

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4 (Mobile-First Responsive)
- **Backend:** Next.js Route Handlers (`/api/v1/*`) + Layered Service Architecture + Zod Validation + Rate Limiting
- **Database:** PostgreSQL 16 + PostGIS 3.4 + Prisma ORM (8 ตารางหลัก + GiST Spatial Index)
- **External Services:** Google Places API (New), Google Maps JavaScript API, Browser Geolocation API

## Development Roadmap (Complete)

- [x] **Phase 1: Project Setup** — โครงสร้างโปรเจกต์, Database Schema + PostGIS, Health API, UI พื้นฐาน
- [x] **Phase 2: Food Randomizer** — ฐานข้อมูลเมนู 30 รายการ 6 หมวดหมู่, REST API (`/api/v1/menus*`), หน้าสุ่มอาหารพร้อม Animation และระบบกันสุ่มซ้ำ
- [x] **Phase 3: Restaurant Finder** — GPS + จังหวัด/อำเภอ, Google Places API (New) Adapter (Live/Mock + Short-term Cache + Photo Proxy), PostGIS Nearby Search (`GET /api/v1/restaurants/nearby`), List & Map View
- [x] **Phase 4: Restaurant Matching** — จับคู่เมนูกับร้าน (`VERIFIED` vs `INFERRED`), Bayesian Ranking Algorithm (`matchScore` 0–100), ตัวกรองสถานะยืนยันเมนู, API `GET /api/v1/restaurants/[id]` และหน้า Restaurant Detail (`/restaurants/[id]`)
- [x] **Phase 5: Reviews & User System** — ระบบสมาชิก (scrypt + Signed HttpOnly Cookie), ความยินยอมและสิทธิการลบข้อมูล PDPA, รีวิวบนเว็บไซต์แยกจาก Google Places, ร้านโปรด และประวัติการสุ่ม (`/auth/*`, `/profile`, `/api/v1/auth/*`, `/api/v1/reviews*`, `/api/v1/favorites`, `/api/v1/history`)
- [x] **Phase 6: Delivery & Deployment** — Whitelisted Delivery Links (GrabFood / LINE MAN + Search Fallback), API Rate Limiting, Security Headers, `/privacy` PDPA Notice, Production Multi-stage `Dockerfile` และคู่มือ Deployment

## การติดตั้งและเปิดใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables
คัดลอกไฟล์ `.env.example` เป็น `.env`:
```bash
cp .env.example .env
```

> **หมายเหตุเรื่อง Mock / Live Mode:**
> - ค่าเริ่มต้นคือ `EXTERNAL_API_MODE="mock"` เพื่อให้พัฒนาและทดสอบได้โดยไม่ต้องใช้ Google API Key และระบบจะแสดงแถบแจ้งเตือน Mock Mode บนหน้าเว็บอย่างชัดเจน
> - เมื่อพร้อมใช้งานจริง ให้เปลี่ยนเป็น `EXTERNAL_API_MODE="live"` และ `NEXT_PUBLIC_EXTERNAL_API_MODE="live"` พร้อมตั้งค่า `GOOGLE_PLACES_API_KEY` (ฝั่ง Server เท่านั้น — ห้ามใช้ `NEXT_PUBLIC_`) และ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### 3. เปิดฐานข้อมูล PostgreSQL + PostGIS ด้วย Docker
```bash
npm run db:up
```

### 4. สร้าง Prisma Client, Push Schema และ Seed ข้อมูลตั้งต้น
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 5. รันเซิร์ฟเวอร์พัฒนา (Development Server)
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:3000` และตรวจสอบ Health API ได้ที่ `http://localhost:3000/api/v1/health`

## คำสั่งทดสอบและตรวจสอบคุณภาพโค้ด

```bash
npm run db:validate   # ตรวจสอบ Prisma Schema
npm run typecheck     # ตรวจสอบ TypeScript
npm run lint          # ตรวจสอบ ESLint
npm run test          # รัน Unit Tests (Vitest)
npm run build         # ทดสอบ Production Build
```

## Production Deployment & Security Checklist

1. **Secrets & Environment:**
   - ตั้งค่า `AUTH_JWT_SECRET` เป็นค่าสุ่มความยาวอย่างน้อย 32 ตัวอักษร
   - เก็บ `GOOGLE_PLACES_API_KEY` ไว้ใน Server Environment เท่านั้น (รูปภาพถูก Proxy ผ่าน `/api/v1/places/photo` โดยไม่ส่ง Key ไปยังเบราว์เซอร์)
   - ตั้งค่า `NODE_ENV="production"` เพื่อเปิดใช้งาน `Secure` Cookie flag อัตโนมัติ
2. **Database & Migrations:**
   - รัน `npx prisma migrate deploy` และ `npm run db:seed` บนฐานข้อมูล PostgreSQL + PostGIS
3. **Docker Production Stack:**
   ```bash
   docker compose --profile prod up -d --build
   ```
4. **Rate Limiting & Cost Control:**
   - ปรับ `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS` และ `PLACES_CACHE_TTL_SECONDS` ให้เหมาะกับทราฟฟิกจริง
