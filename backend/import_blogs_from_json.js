/**
 * Import blog data từ file JSON vào MongoDB.
 * Chạy: node import_blogs_from_json.js [đường_dẫn_file.json]
 * Mặc định: chuyenlangnghe.Blog (1).json trong thư mục cha (Downloads)
 */
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'chuyenlangnghe';

function convertMongoJson(obj) {
  if (Array.isArray(obj)) return obj.map(convertMongoJson);
  if (obj && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      const val = obj[key];
      if (key === '_id' && val && val.$oid) {
        newObj[key] = new ObjectId(val.$oid);
      } else if (val && typeof val === 'object' && val.$date) {
        newObj[key] = new Date(val.$date);
      } else {
        newObj[key] = convertMongoJson(val);
      }
    }
    return newObj;
  }
  return obj;
}

async function importBlogs() {
  const jsonPath = process.argv[2] || path.join(__dirname, 'chuyenlangnghe.Blog.json');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Không tìm thấy file:', jsonPath);
    console.log('Cách dùng: node import_blogs_from_json.js [đường_dẫn_file.json]');
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);

  try {
    console.log('Đang kết nối MongoDB...');
    await client.connect();
    console.log('Kết nối thành công.\n');

    const raw = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(raw);
    const blogs = Array.isArray(data) ? data : [data];

    const converted = convertMongoJson(blogs);

    const db = client.db(dbName);
    const blogCollection = db.collection('Blog');

    console.log(`Xóa blog cũ và thêm ${converted.length} blog mới...`);
    await blogCollection.deleteMany({});
    const result = await blogCollection.insertMany(converted);

    console.log(`\n✅ Đã import ${result.insertedCount} blog!`);
    converted.forEach((b, i) => console.log(`   ${i + 1}. ${b.title}`));
    console.log('\n✨ Xem tại: http://localhost:4200/blog\n');

  } catch (err) {
    console.error('\n❌ Lỗi:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.log('-> Kiểm tra MongoDB đã chạy chưa.');
    }
    process.exit(1);
  } finally {
    await client.close();
    console.log('Đã đóng kết nối.');
  }
}

importBlogs();
