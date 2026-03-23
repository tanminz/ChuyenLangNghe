/**
 * Khôi phục blog từ chuyenlangnghe.Blog.json (data + image từ JSON, không remap).
 * Chạy: node restore_blog_from_json.js
 */
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'chuyenlangnghe';
const BACKEND = path.join(__dirname);

const SLUG_TO_SECTION = {
  'doi-tay-nhuom-mau': 'featured_center',
  'gom-chu-dau': 'featured',
  'giua-lang-va-pho': 'featured',
  'son-mai-tuong-binh-hiep': 'featured',
  'hanh-trinh-non-la': 'featured',
  'nguoi-giu-lua-lo-gom': 'latest',
  'tro-ve-de-tiep-noi': 'latest',
  'khong-hoan-hao': 'latest',
  'bat-trang-700-nam': 'latest',
  'mot-doi-mot-nghe': 'artisan',
  'giu-nghe-hay-giu-ky-uc': 'artisan',
  'tu-dat-thanh-hinh': 'craft_village'
};

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

async function restoreBlogs() {
  const jsonPath = path.join(BACKEND, 'chuyenlangnghe.Blog.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Không tìm thấy chuyenlangnghe.Blog.json');
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(raw);
  const blogs = Array.isArray(data) ? data : [data];

  console.log('Import vào MongoDB (data + image từ JSON)...\n');
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const blogCollection = db.collection('Blog');
    const converted = convertMongoJson(blogs);
    converted.forEach(doc => {
      doc.section = SLUG_TO_SECTION[doc.slug] || 'craft_village';
    });

    await blogCollection.deleteMany({});
    const result = await blogCollection.insertMany(converted);
    console.log(`✅ Đã import ${result.insertedCount} blog.`);
  } catch (err) {
    console.error('❌ Lỗi MongoDB:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
  console.log('\n✨ Xong. Đảm bảo backend/src/public/uploads/blogs/ có các file ảnh như trong JSON.\n');
}

restoreBlogs();
