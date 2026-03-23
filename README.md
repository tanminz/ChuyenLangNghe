# Chuyen Lang Nghe

Website thuong mai cho san pham thu cong lang nghe Viet Nam.

Du an gom:
- `frontend`: Angular
- `backend`: Node.js + Express + MongoDB
- AI chatbox: route `POST /ai/chat` (Gemini + du lieu san pham/blog/coupon trong DB)

## 1) Yeu cau moi truong

- Node.js 18+
- npm 9+
- MongoDB local hoac Atlas

## 2) Cai dat

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## 3) Cau hinh `.env` backend

Tao file `backend/.env` (hoac cap nhat neu da co):

```env
PORT=3002
MONGODB_URI=mongodb://127.0.0.1:27017
DB_NAME=chuyenlangnghe
SESSION_SECRET=change_me
JWT_SECRET=change_me

# Cho phep frontend chay 4200/4201
CORS_ORIGIN=http://localhost:4200,http://localhost:4201

# Optional: Upload
FILESTACK_API_KEY=
FILESTACK_STORE_LOCATION=S3
FILESTACK_STORE_PATH=products/

# AI chatbox (Gemini)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

Luu y:
- Khong commit `.env` len git.
- Neu lo key thi regen key moi.

## 4) Chay du an

### Chay backend

```bash
cd backend
npm run dev
```

Mac dinh backend: `http://localhost:3002`.

### Chay frontend

```bash
cd frontend
npm start
```

Mac dinh frontend: `http://localhost:4200`.

Neu bao `Port 4200 is already in use`, chon `Y` de chay `4201`.

## 5) Kiem tra nhanh

### Health backend

Mo trinh duyet:
- `http://localhost:3002/health` (neu route nay co bat trong backend)

### Kiem tra AI chat API

Gui request mau:

```bash
curl -X POST http://localhost:3002/ai/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"xin chao\",\"history\":[]}"
```

Neu thanh cong se tra JSON co `answer` va `sources`.

## 6) Seed du lieu (neu can)

```bash
cd backend
npm run db:create
```

Scripts co san:
- `npm run db:seed:products`
- `npm run db:seed:blogs`
- `npm run db:seed:contacts`
- `npm run db:check`

## 7) Proxy frontend

Angular dang dung proxy:
- `frontend/src/proxy.conf.json`

Cac route nhu `/products`, `/user`, `/orders`, `/blogs`, `/coupons`, `/ai` duoc proxy ve backend `3002`.

## 8) Tai khoan mau

- Admin: `admin@uel.edu.vn`
- User: `user@uel.edu.vn`
- Password: `112233`

Co the thay local-part email, password giu nguyen theo seed hien tai.

## 9) Loi thuong gap

- **Chatbox bao khong ket noi duoc AI**
  - Kiem tra `GEMINI_API_KEY` trong `backend/.env`
  - Kiem tra backend da restart sau khi sua `.env`
  - Kiem tra frontend da restart de nap proxy moi

- **CORS loi khi frontend chay 4201**
  - Dat `CORS_ORIGIN=http://localhost:4200,http://localhost:4201`

- **MongoDB khong ket noi**
  - Kiem tra `MONGODB_URI`, `DB_NAME`, va dich vu MongoDB dang chay
