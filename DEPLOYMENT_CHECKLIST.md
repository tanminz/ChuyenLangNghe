# Deployment Checklist (ChuyenLangNghe)

Checklist thuc te cho stack hien tai:
- Frontend: Angular (Vercel)
- Backend: Node.js/Express + MongoDB
- DB de xuat: MongoDB Atlas (uy tin, phu hop code hien tai)
- Media lon (video/anh): Cloudinary (hoac Cloudflare R2)

## 0) Chot trang thai code truoc khi release

- [ ] Dang o nhanh `master` va working tree sach:
  - `git status`
- [ ] Da push backup len `main`:
  - `git push origin HEAD:main`
- [ ] Da push nhanh deploy `master`:
  - `git push origin master`

## 1) Tao he thong luu data uy tin

### 1.1 MongoDB Atlas (database production)
- [ ] Tao cluster Atlas (M0/M10 tuy nhu cau)
- [ ] Tao database user rieng cho app
- [ ] Add IP allow list (tam thoi `0.0.0.0/0` de test, sau do siet lai)
- [ ] Lay connection string:
  - `mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority`

### 1.2 Noi dung media lon (asset/video)
- [ ] Tao tai khoan Cloudinary (hoac R2)
- [ ] Upload video lon len Cloudinary/CDN
- [ ] Luu URL CDN vao DB (khong de file >100MB trong repo/frontend)

## 2) Bien moi truong backend

Tao `backend/.env` (tham chieu tu `backend/.env.example`):

```env
PORT=3002
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
DB_NAME=chuyenlangnghe
SESSION_SECRET=<chuoi-ngau-nhien-dai>
CORS_ORIGIN=https://frontend-tanminzs-projects.vercel.app,https://frontend-*.vercel.app

GEMINI_API_KEY=<your_key>
GEMINI_MODEL=gemini-1.5-flash
GEMINI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta
```

Ghi chu:
- Khong commit `.env`.
- `SESSION_SECRET` nen >= 32 ky tu.
- Khi doi domain frontend thi cap nhat `CORS_ORIGIN`.

## 3) Deploy backend

Co the dung Render/Railway. Trinh tu chung:
- [ ] Tao service tu repo `ChuyenLangNghe/backend`
- [ ] Build command: `npm install`
- [ ] Start command: `npm run dev` (hoac `node index.js` neu khong dung nodemon)
- [ ] Add env vars nhu muc (2)
- [ ] Sau deploy, test:
  - `GET /health` (neu co)
  - `POST /ai/chat`
  - cac route `/products`, `/blogs`, `/orders`

## 4) Noi frontend voi backend production

Project hien tai frontend dung relative routes (`/products`, `/user`, `/orders`, ...),
vi vay can reverse proxy tren Vercel de route ve backend production.

- [ ] Dat backend base URL, vi du:
  - `https://chuyenlangnghe-api.onrender.com`
- [ ] Cap nhat `frontend/vercel.json` them rewrites API:

```json
{
  "rewrites": [
    { "source": "/products/:path*", "destination": "https://<backend-domain>/products/:path*" },
    { "source": "/user/:path*", "destination": "https://<backend-domain>/user/:path*" },
    { "source": "/orders/:path*", "destination": "https://<backend-domain>/orders/:path*" },
    { "source": "/feedback/:path*", "destination": "https://<backend-domain>/feedback/:path*" },
    { "source": "/cart/:path*", "destination": "https://<backend-domain>/cart/:path*" },
    { "source": "/blogs/:path*", "destination": "https://<backend-domain>/blogs/:path*" },
    { "source": "/dashboard/:path*", "destination": "https://<backend-domain>/dashboard/:path*" },
    { "source": "/coupons/:path*", "destination": "https://<backend-domain>/coupons/:path*" },
    { "source": "/ai/:path*", "destination": "https://<backend-domain>/ai/:path*" },
    { "source": "/uploads/:path*", "destination": "https://<backend-domain>/uploads/:path*" },
    { "source": "/((?!.*\\.).*)", "destination": "/index.html" }
  ]
}
```

- [ ] Deploy lai frontend:
  - `cd frontend`
  - `npx vercel --prod --yes`

## 5) Tach asset lon khoi repo

Can lam ngay vi hien tai co file rat lon trong `frontend/src/assets` (vi du `banner-uhd.mp4`).

- [ ] Upload cac video >20MB len Cloudinary/CDN
- [ ] Doi link trong HTML sang URL CDN
- [ ] Giu local file chi cho dev (neu can), va bo sung ignore:
  - `frontend/.vercelignore`
- [ ] (Khuyen nghi) git history clean cho file media lon neu repo phinh qua nhanh

## 6) Migrate du lieu cu (local Mongo -> Atlas)

### Cach an toan, de rollback
- [ ] Backup local:
  - `mongodump --uri="mongodb://127.0.0.1:27017/chuyenlangnghe" --out=./backup_local`
- [ ] Restore len Atlas:
  - `mongorestore --uri="mongodb+srv://<user>:<pass>@<cluster>/chuyenlangnghe" ./backup_local/chuyenlangnghe`
- [ ] Verify sau restore:
  - `npm run db:check` (trong `backend`, voi `.env` dang tro Atlas)
  - check collection: `Product`, `User`, `Order`, `Feedback`, `Cart`, `Blog`, `ProductReview`, `Coupon`
- [ ] Chay migration script neu can:
  - `node migrate_blog_sections.js`
  - `node migrate_blogs_slug_and_images_to_files.js`

## 7) Smoke test sau cung (production)

- [ ] Mo web production, test dang nhap, gio hang, dat hang
- [ ] Test chat AI (`/ai/chat`)
- [ ] Test upload/anh blog/product
- [ ] Test CORS khong bao loi tren console
- [ ] Theo doi log backend 24h dau sau release

## 8) Rollback plan (bat buoc)

- [ ] Neu frontend loi: redeploy deployment truoc trong Vercel
- [ ] Neu backend loi: rollback service ve commit truoc
- [ ] Neu DB loi: restore tu ban `mongodump` backup

---

Neu ban muon, buoc tiep theo la minh cap nhat thang `frontend/vercel.json` theo backend URL that su cua ban, de frontend production goi API production ngay.
