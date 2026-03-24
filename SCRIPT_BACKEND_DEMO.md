# SCRIPT DEMO BACKEND – Chi tiết file, dòng, chức năng

---

## 1. `backend/src/app.js` – Entry point & cấu hình

| Dòng | Nội dung | Nói gì |
|------|----------|--------|
| 1–6 | Import express, cors, session, MongoStore | "Dùng Express, CORS, session lưu trong MongoDB." |
| 8 | `require('./config/env')` | "Biến môi trường load từ config." |
| 10–17 | Import các route | "Mỗi module tương ứng một nhóm API: products, users, cart, orders, feedback, dashboard, blogs, coupons, ai." |
| 21 | `morgan('combined')` | "Middleware ghi log mỗi request." |
| 22–33 | CORS config | "CORS chỉ cho phép origin trong CORS_ORIGINS từ .env, credentials true để gửi cookie." |
| 34–35 | `express.json`, `urlencoded` | "Parse body JSON, limit 50MB cho upload ảnh." |
| 36–51 | Session config | "Session lưu vào MongoDB collection `sessions`, cookie httpOnly, sameSite strict, maxAge 24h." |
| 53–54 | `express.static('/uploads')` | "Phục vụ file ảnh tĩnh từ thư mục uploads." |
| 56–64 | `app.use` mount routes | "Products gắn /products, user gắn /user, cart /cart, orders /orders, feedback /feedback, dashboard /dashboard, blogs /blogs, coupons /coupons, ai /ai." |
| 66–71 | CORS error handler | "Nếu CORS block thì trả 403, còn lỗi khác thì next." |

**Câu tổng:** "app.js là entry point: cấu hình CORS, session, body parser, mount các route. Mỗi route gắn với một domain: sản phẩm, đơn hàng, user, coupon, blog, AI chat."

---

## 2. `backend/src/config/env.js` – Biến môi trường

| Dòng | Nội dung | Nói gì |
|------|----------|--------|
| 1 | `require('dotenv').config()` | "Load biến từ file .env." |
| 3–9 | `parseCorsOrigins` | "CORS_ORIGIN trong .env là chuỗi ngăn bằng dấu phẩy, parse thành mảng." |
| 12–20 | Export các biến | "PORT mặc định 3002, MONGODB_URI, DB_NAME, SESSION_SECRET, NODE_ENV, CORS_ORIGINS, GEMINI_API_KEY, GEMINI_MODEL, GEMINI_API_BASE_URL. Không hardcode để bảo mật." |

**Câu tổng:** "Config env: PORT, MongoDB URI, session secret, CORS, Gemini API key đều lấy từ .env."

---

## 3. `backend/src/config/database.js` – Kết nối MongoDB

| Dòng | Nội dung | Nói gì |
|------|----------|--------|
| 1–4 | Import MongoClient, MONGODB_URI, DB_NAME | "Kết nối MongoDB qua URI từ env." |
| 7–26 | `connectDatabase()` | "Connect client, lấy db, khởi tạo collections: Product, User, Order, Feedback, Cart, Blog, ProductReview, Coupon." |
| 28–34 | `getCollections()` | "Trả về object collections để các route dùng." |

**Câu tổng:** "Database config: connect MongoDB, map các collection Product, User, Order, Blog, Coupon,... dùng chung cho toàn backend."

---

## 4. `backend/src/middlewares/auth.js` – Phân quyền

| Dòng | Nội dung | Nói gì |
|------|----------|--------|
| 1–5 | `requireAuth` | "Kiểm tra req.session.userId; không có thì 401 Unauthorized." |
| 8–12 | `requireAdmin` | "Kiểm tra userId và role === 'admin'; không đủ thì 403 Forbidden." |
| 15–31 | `requireRoleAction` | "Kiểm tra role và action (edit all, sales ctrl, view...); admin có quyền khác nhau." |

**Câu tổng:** "Middleware auth: requireAuth cho API cần đăng nhập, requireAdmin cho trang admin, requireRoleAction cho phân quyền chi tiết."

---

## 5. `backend/src/routes/products.routes.js` – API sản phẩm

| Dòng | Nội dung | Chức năng | Nói gì |
|------|----------|-----------|--------|
| 10–59 | `GET /` | Danh sách sản phẩm | "Lấy query page, limit, dept, type, includeImages. Build filter, projection (all hoặc primary ảnh). Find, sort, skip, limit, count. Trả products, total, page, pages." |
| 61–72 | `GET /:id` | Chi tiết 1 sản phẩm | "FindOne theo ObjectId, 404 nếu không có." |
| 74–148 | `POST /` | Thêm sản phẩm (admin) | "Có requireRoleAction admin. Validate product_name, unit_price, stocked_quantity, discount. Insert, persistImageMaybe cho 5 ảnh (base64 hoặc URL), update lại ảnh. 201 nếu thành công." |
| 150–194 | `PATCH /:id` | Sửa sản phẩm (admin) | "requireRoleAction. Lấy existing, xử lý ảnh mới qua persistImageMaybe, updateOne." |
| 204–207 | `DELETE /:id` | Xóa 1 sản phẩm (admin) | "requireRoleAction, deleteOne." |
| 210–223 | `DELETE /` body productIds | Xóa nhiều (admin) | "requireAdmin, nhận mảng productIds, deleteMany." |
| 225–241 | `PATCH /:id/update-stock` | Cập nhật tồn kho | "$inc stocked_quantity theo quantity trong body." |
| 243–284 | `GET /:id/reviews` | Lấy đánh giá | "Phân trang, sort, aggregate tính averageRating và ratingCounts." |
| 286–329 | `POST /:id/reviews` | Thêm đánh giá | "requireAuth. Validate rating 1–5, comment, images. Insert vào ProductReview." |

**Câu tổng:** "Products route: GET list có phân trang, lọc dept/type, chọn ảnh; GET :id chi tiết; POST/PATCH/DELETE cho admin; update-stock; reviews CRUD."

---

## 6. `backend/src/routes/orders.routes.js` – API đơn hàng

| Dòng | Nội dung | Chức năng | Nói gì |
|------|----------|-----------|--------|
| 12–94 | `GET /me` | Đơn của user hiện tại | "requireAuth. Filter userId từ session. Aggregate: match, sort, skip, limit, $lookup Product để join thông tin sản phẩm, $addFields selectedItems. Trả orders, total, page, pages." |
| 96+ | `GET /history/:userId` | Lịch sử đơn (admin) | "requireAuth, kiểm tra quyền. Lấy đơn theo userId." |
| (còn lại) | POST tạo đơn, PATCH cập nhật trạng thái | Tạo đơn, cập nhật trạng thái | "Tạo đơn: kiểm tra coupon, tính discount, lưu Order. Admin PATCH trạng thái (pending, confirmed, shipped, delivered, cancelled)." |

**Câu tổng:** "Orders: GET /me lấy đơn của user, có $lookup join Product; POST tạo đơn kèm coupon; PATCH cập nhật trạng thái."

---

## 7. `backend/src/routes/users.routes.js` – API user

| Dòng | Nội dung | Chức năng | Nói gì |
|------|----------|-----------|--------|
| 9–40 | `POST /signup` | Đăng ký | "Validate profileName, email, password. Check email trùng, bcrypt.hash, insert User. 201." |
| 43–80 | `POST /login` | Đăng nhập | "Find user theo email, bcrypt.compare. Lưu userId, role, action vào session. rememberMe thì maxAge 30 ngày." |

**Câu tổng:** "Users: signup hash mật khẩu, login so sánh bcrypt và lưu session."

---

## 8. `backend/src/routes/coupons.routes.js` – API coupon

| Dòng | Nội dung | Chức năng | Nói gì |
|------|----------|-----------|--------|
| 31–58 | `GET /admin/list` | Danh sách coupon (admin) | "requireRoleAction admin. Phân trang, tìm kiếm code/description. Trả coupons, total, page, pages." |
| (còn) | GET check, POST/PATCH/DELETE | Kiểm tra coupon, CRUD | "Check coupon hợp lệ: validFrom/validTo, usedCount vs usageLimit, isActive. CRUD cho admin." |

**Câu tổng:** "Coupons: admin list có phân trang, search; check availability; CRUD coupon."

---

## 9. `backend/src/routes/ai.routes.js` – API AI Chat

| Dòng | Nội dung | Chức năng | Nói gì |
|------|----------|-----------|--------|
| 1–2 | Import router, createChatbotReply | "Dùng service chatbot để xử lý câu hỏi." |
| 6–20 | `POST /chat` | Endpoint AI | "Lấy message và history từ body. Gọi createChatbotReply. Trả 200 với result. Catch: Message required → 400, lỗi khác → 500." |

**Câu tổng:** "Route AI: POST /chat nhận message + history, gọi service, trả answer và sources."

---

## 10. `backend/src/ai/services/chatbot.service.js` – Logic AI

| Dòng | Nội dung | Chức năng | Nói gì |
|------|----------|-----------|--------|
| 8–20 | `sanitizeHistory` | Làm sạch lịch sử | "Chỉ giữ user/assistant, 8 tin gần nhất, cắt content 2000 ký tự." |
| 52–110 | `createChatbotReply` | Luồng chính | "Validate message. Gọi retrieveKnowledge lấy products/blogs/coupons. Detect intent (product, blog, coupon, general). Nếu product_lookup → buildProductAnswer; blog_lookup → buildBlogAnswer; coupon_lookup → buildCouponAnswer. Còn general → buildSystemInstruction, gọi generateGeminiAnswer. Nếu Gemini lỗi thì fallback buildFallbackAnswer. Trả answer + sources." |

**Câu tổng:** "Chatbot service: lấy tri thức từ DB, detect intent, nếu rõ ràng thì format trả ngay; nếu chung chung thì gọi Gemini; có fallback khi API lỗi."

---

## 11. `backend/src/ai/services/knowledge.service.js` – Lấy tri thức

| Dòng | Nội dung | Chức năng | Nói gì |
|------|----------|-----------|--------|
| 1 | Import searchProducts, searchBlogs, searchCoupons | "Gọi repository tìm trong 3 collection." |
| 3–14 | `retrieveKnowledge(question)` | "Promise.all 3 search song song. Trả object { products, blogs, coupons }." |

**Câu tổng:** "Knowledge service: song song truy vấn products, blogs, coupons theo câu hỏi."

---

## 12. `backend/src/ai/repositories/knowledge.repository.js` – Tìm kiếm trong DB

| Dòng | Nội dung | Chức năng | Nói gì |
|------|----------|-----------|--------|
| 7–20 | `extractKeywords` | "Chuẩn hóa tiếng Việt, tách từ, lấy 8 từ khóa." |
| 39–50 | `getPreferredTags` | "Map gom/tre/tuong/lich để biết user muốn loại nào." |
| 52–74 | `getExcludedTerms` | "Regex bắt 'không phải X', 'tru X' để loại trừ (vd: gốm mà không phải lịch)." |
| 76+ | `scoreProduct` | "Chấm điểm product theo keyword, preferred tags, excluded terms." |
| searchProducts | | "Tìm trong Product, score, sort, limit." |
| searchBlogs, searchCoupons | | "Regex tìm trong Blog, Coupon." |

**Câu tổng:** "Repository: extract keyword, detect preferred/excluded, score product để AI gợi ý đúng ý user (vd: gốm không phải lịch)."

---

## 13. `backend/src/ai/services/gemini.service.js` – Gọi Gemini API

| Dòng | Nội dung | Chức năng | Nói gì |
|------|----------|-----------|--------|
| 1 | getGeminiConfig | "Lấy apiKey, model, apiBaseUrl từ env." |
| 11–22 | `extractTextFromResponse` | "Lấy text từ response Gemini (candidates[0].content.parts)." |
| 25–71 | `generateGeminiAnswer` | "Format contents: history + userMessage. POST generateContent với systemInstruction, generationConfig (temperature 0.3, maxOutputTokens 900). Parse response, extract text. Throw nếu lỗi." |

**Câu tổng:** "Gemini service: format prompt, gọi Google API, lấy text trả về. Có xử lý lỗi và empty response."

---

## 14. Thứ tự quay gợi ý (flow nói)

1. **app.js** (dòng 1–64): "Đây là entry point. CORS, session, body parser, mount routes."
2. **config/env.js** (dòng 1–20): "Biến môi trường."
3. **config/database.js** (dòng 7–34): "Kết nối MongoDB, collections."
4. **middlewares/auth.js** (dòng 1–31): "requireAuth, requireAdmin, requireRoleAction."
5. **routes/products.routes.js** (dòng 10–60, 74–95): "GET list phân trang, POST thêm sản phẩm admin."
6. **routes/orders.routes.js** (dòng 12–94): "GET /me, aggregate $lookup."
7. **routes/ai.routes.js** (dòng 1–21): "POST /chat."
8. **ai/services/chatbot.service.js** (dòng 52–110): "createChatbotReply, intent, retrieveKnowledge, Gemini."
9. **ai/services/knowledge.service.js** (dòng 3–14): "retrieveKnowledge song song."
10. **ai/repositories/knowledge.repository.js** (dòng 7–50, scoreProduct): "Keyword, preferred/excluded, scoring."
11. **ai/services/gemini.service.js** (dòng 25–71): "generateGeminiAnswer, call API."

---

## 15. Câu chốt cho từng phần

- **Cấu hình:** "app.js mount toàn bộ route, env.js load biến, database.js connect MongoDB."
- **Auth:** "Middleware requireAuth, requireAdmin, requireRoleAction để bảo vệ API."
- **Products:** "CRUD, phân trang, lọc, persist ảnh, reviews."
- **Orders:** "GET /me dùng aggregate $lookup join Product; tạo đơn, cập nhật trạng thái."
- **AI:** "Route /chat → chatbot.service → retrieveKnowledge (knowledge.service + repository) → detect intent → Gemini hoặc fallback → trả answer + sources."
