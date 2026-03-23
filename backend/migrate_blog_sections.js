/**
 * Gán section cho blog đã có trong DB (slug → section).
 * Chạy: node migrate_blog_sections.js
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'chuyenlangnghe';

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
  'tu-dat-thanh-hinh': 'artisan',
  'lang-chieu-coi-nga-son': 'craft_village',
  'lang-chieu-coi-nga-son-det-nang-tren-tung-soi': 'craft_village',
  'lang-duc-dong-dai-bai': 'craft_village',
  'lang-duc-dong-dai-bai-lua-va-dong-qua-nghin-nam': 'craft_village',
  'lang-may-tre-dan-phu-vinh': 'craft_village',
  'lang-may-tre-dan-phu-vinh-deo-dai-tu-tre-nua': 'craft_village'
};

async function migrate() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const coll = db.collection('Blog');
    let updated = 0;
    for (const [slug, section] of Object.entries(SLUG_TO_SECTION)) {
      const r = await coll.updateMany(
        { slug },
        { $set: { section, updatedAt: new Date() } }
      );
      updated += r.modifiedCount;
    }
    // Fallback: cập nhật theo title (Làng chiếu cói Nga Sơn, Làng đúc đồng Đại Bái, Làng mây tre đan Phú Vinh)
    const rTitle = await coll.updateMany(
      {
        $or: [
          { title: { $regex: /chiếu cói.*nga sơn|nga sơn.*chiếu cói/i } },
          { title: { $regex: /đúc đồng.*đại bái|đại bái.*đúc đồng/i } },
          { title: { $regex: /mây tre đan.*phú vinh|phú vinh.*mây tre/i } }
        ]
      },
      { $set: { section: 'craft_village', updatedAt: new Date() } }
    );
    updated += rTitle.modifiedCount;

    // Blog không có slug khớp → mặc định craft_village
    const r2 = await coll.updateMany(
      { $or: [{ section: { $exists: false } }, { section: null }] },
      { $set: { section: 'craft_village', updatedAt: new Date() } }
    );
    updated += r2.modifiedCount;
    console.log(`✅ Đã cập nhật section cho ${updated} blog.`);
  } finally {
    await client.close();
  }
}

migrate().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
