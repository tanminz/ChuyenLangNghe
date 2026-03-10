/**
 * Script tạo Database dacsan3mien với các Collection giống DB cũ
 * Chạy: node create_db.js
 * 
 * Collections: Product, User, Order, Feedback, Cart, Blog
 * Dữ liệu mẫu: User (từ EYECONIC.User.json), Blog, Feedback
 */

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'chuyenlangnghe';

// Chuyển $oid sang ObjectId
function convertIds(obj) {
  if (Array.isArray(obj)) return obj.map(convertIds);
  if (obj && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (key === '_id' && obj[key] && obj[key].$oid) {
        newObj[key] = new ObjectId(obj[key].$oid);
      } else {
        newObj[key] = convertIds(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

// Sample Blogs (từ seed_blogs.js)
const sampleBlogs = [
  {
    title: '🌟 CHÈ TÂN CƯƠNG – LINH HỒN CỦA ĐẤT TRÀ THÁI NGUYÊN',
    description: 'Vùng đất Tân Cương – nơi hội tụ khí hậu và thổ nhưỡng hoàn hảo cho cây chè.',
    content: 'Vùng đất Tân Cương, Thái Nguyên là nơi hội tụ những yếu tố tự nhiên tuyệt vời...',
    image: '',
    author: 'Admin',
    published: true,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15')
  },
  {
    title: '🐟 MẮM CÁ LINH CÀ MAU – HƯƠNG VỊ MÙA NƯỚC NỔI MIỀN TÂY',
    description: 'Khi mùa nước nổi tràn về, người dân háo hức đón mùa cá linh.',
    content: 'Mỗi năm, khi mùa nước nổi về, đồng bằng sông Cửu Long lại nhộn nhịp mùa cá linh...',
    image: '',
    author: 'Admin',
    published: true,
    createdAt: new Date('2025-01-14'),
    updatedAt: new Date('2025-01-14')
  },
  {
    title: '☕ CÀ PHÊ BUÔN MA THUỘT – HƯƠNG VỊ TÂY NGUYÊN',
    description: 'Vùng đất đỏ bazan Tây Nguyên, nơi sinh ra những hạt cà phê chất lượng cao.',
    content: 'Buôn Ma Thuột được mệnh danh là thủ đô cà phê Việt Nam...',
    image: '',
    author: 'Admin',
    published: true,
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10')
  }
];

// Sample Feedback (từ seed_contacts.js)
const sampleFeedback = [
  { fullName: 'Nguyễn Văn An', email: 'nguyenvanan@gmail.com', phone: '0901234567', message: 'Xin chào, tôi muốn hỏi về đặc sản chè Tân Cương.', status: 'new', submittedAt: new Date() },
  { fullName: 'Trần Thị Bình', email: 'tranthib@yahoo.com', phone: '0912345678', message: 'Cho tôi hỏi về set quà Tết 3 miền.', status: 'read', submittedAt: new Date() }
];

const COLLECTIONS = ['Product', 'User', 'Order', 'Feedback', 'Cart', 'Blog'];

async function createDatabase() {
  const client = new MongoClient(mongoUri);
  
  try {
    console.log('Đang kết nối MongoDB...');
    await client.connect();
    console.log('✅ Kết nối thành công!\n');

    const db = client.db(dbName);

    // 1. Tạo các collection (drop nếu đã tồn tại để tạo mới)
    console.log('📁 Tạo các Collection:');
    for (const colName of COLLECTIONS) {
      const collections = await db.listCollections({ name: colName }).toArray();
      if (collections.length > 0) {
        await db.collection(colName).drop();
        console.log(`   - ${colName}: đã xóa và tạo lại`);
      }
      await db.createCollection(colName);
      console.log(`   - ${colName}: ✓`);
    }

    // 2. Import User từ EYECONIC.User.json
    const userJsonPath = path.join(__dirname, 'EYECONIC.User.json');
    if (fs.existsSync(userJsonPath)) {
      const userData = JSON.parse(fs.readFileSync(userJsonPath, 'utf-8'));
      const users = convertIds(userData);
      await db.collection('User').insertMany(users);
      console.log(`\n👤 Đã import ${users.length} user từ EYECONIC.User.json`);
      console.log('   Tài khoản: admin@uel.edu.vn / user@uel.edu.vn | Mật khẩu: 112233');
    } else {
      console.log('\n⚠ Không tìm thấy EYECONIC.User.json, bỏ qua import User');
    }

    // 3. Seed Blog
    await db.collection('Blog').insertMany(sampleBlogs);
    console.log(`\n📝 Đã thêm ${sampleBlogs.length} blog mẫu`);

    // 4. Seed Feedback
    await db.collection('Feedback').insertMany(sampleFeedback);
    console.log(`\n📬 Đã thêm ${sampleFeedback.length} feedback mẫu`);

    // 5. Product, Order, Cart - để trống (thêm qua app)
    console.log('\n📦 Product, Order, Cart: để trống (thêm dữ liệu qua website)');

    console.log('\n✅ Hoàn tất! Database "' + dbName + '" đã sẵn sàng.');
    console.log('\nChạy backend: node index.js');
    console.log('Chạy frontend: ng serve (trong thư mục frontend)\n');

  } catch (err) {
    console.error('\n❌ Lỗi:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.log('   → Kiểm tra MongoDB đã chạy chưa: mongosh mongodb://127.0.0.1:27017');
    }
    if (err.message.includes('Authentication failed')) {
      console.log('   → Tạo file .env với MONGODB_URI=mongodb://127.0.0.1:27017 (không auth)');
    }
    process.exit(1);
  } finally {
    await client.close();
    console.log('Đã đóng kết nối MongoDB.');
  }
}

createDatabase();
