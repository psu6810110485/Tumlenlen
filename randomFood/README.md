# Food Roulette — Smart Food Discovery Platform

แพลตฟอร์มช่วยตัดสินใจมื้ออาหารที่ **สุ่มเมนูอาหารตามเงื่อนไข** จากนั้น **ค้นหาร้านอาหารจริงที่ขายเมนูนั้นใกล้ผู้ใช้** พร้อมรีวิว คะแนน ราคา ระยะทาง แผนที่ และลิงก์สั่งอาหาร

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4 (Mobile-First Responsive)
- **Backend:** Next.js Route Handlers (`/api/v1/*`) + Layered Service Architecture + Zod Validation
- **Database:** PostgreSQL 16 + PostGIS 3.4 + Prisma ORM
- **External Services (Phase 3+):** Google Places API (New), Google Maps JavaScript API, Browser Geolocation API

## Current Status: Phase 1 (Project Setup)

สิ่งที่พัฒนาแล้วใน Phase 1:
- โครงสร้างโปรเจกต์ Next.js + TypeScript + Tailwind CSS
- Docker Compose สำหรับ PostgreSQL 16 + PostGIS (`docker-compose.yml`)
- Prisma Schema ครบทั้ง 8 ตาราง (`users`, `categories`, `menus`, `restaurants`, `restaurant_menus`, `reviews`, `favorites`, `random_history`) พร้อม PostGIS `geography(Point, 4326)` และ GiST Spatial Index
- ระบบ Environment Configuration แยก `mock` / `live` Mode ชัดเจน (ไม่เปิดเผย Secret Key บน Frontend)
- REST API Foundation + `GET /api/v1/health` สำหรับตรวจสถานะ API, PostgreSQL + PostGIS และ External API Mode
- UI พื้นฐาน (Navbar, Footer, ModeBanner, Home Page Discovery Form, Loading/Empty/Error States และหน้าเส้นทางที่เชื่อมโยงกันครบทุกหน้า)

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
> - เมื่อพร้อมใช้งานจริง ให้เปลี่ยนเป็น `EXTERNAL_API_MODE="live"` พร้อมตั้งค่า `GOOGLE_PLACES_API_KEY` (ฝั่ง Server เท่านั้น) และ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### 3. เปิดฐานข้อมูล PostgreSQL + PostGIS ด้วย Docker
```bash
npm run db:up
```

### 4. สร้าง Prisma Client, Push Schema และ Seed หมวดหมู่ตั้งต้น
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

## Development Roadmap

- [x] **Phase 1: Project Setup** — โครงสร้างโปรเจกต์, Database Schema + PostGIS, Health API, UI พื้นฐาน
- [x] **Phase 2: Food Randomizer** — ฐานข้อมูลเมนู 30 รายการ 6 หมวดหมู่, REST API (`/api/v1/menus*`), หน้าสุ่มอาหารพร้อม Animation และระบบกันสุ่มซ้ำ
- [x] **Phase 3: Restaurant Finder** — GPS + จังหวัด/อำเภอ, Google Places API (New) Adapter (Live/Mock + Short-term Cache + Photo Proxy), PostGIS Nearby Search (`GET /api/v1/restaurants/nearby`), List & Map View
- [x] **Phase 4: Restaurant Matching** — จับคู่เมนูกับร้าน (`VERIFIED` vs `INFERRED`), Bayesian Ranking Algorithm (`matchScore` 0–100), ตัวกรองสถานะยืนยันเมนู, API `GET /api/v1/restaurants/[id]` และหน้า Restaurant Detail (`/restaurants/[id]`)
- [x] **Phase 5: Reviews & User System** — ระบบสมาชิก (scrypt + Signed HttpOnly Cookie), ความยินยอมและสิทธิการลบข้อมูล PDPA, รีวิวบนเว็บไซต์แยกจาก Google Places, ร้านโปรด และประวัติการสุ่ม (`/auth/*`, `/profile`, `/api/v1/auth/*`, `/api/v1/reviews*`, `/api/v1/favorites`, `/api/v1/history`)
- [ ] **Phase 6: Delivery & Deployment** — GrabFood / LINE MAN Links, Caching, Security Audit, Production Deployment
