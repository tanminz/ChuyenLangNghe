/**
 * Kiểm tra slug và section của blog trong DB.
 * Chạy: node check_blog_sections.js
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'chuyenlangnghe';

async function check() {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const coll = db.collection('Blog');
    const blogs = await coll.find({ published: true }).sort({ _id: 1 }).limit(50).toArray();
    console.log(`\nTổng ${blogs.length} blog published:\n`);
    for (const b of blogs) {
      const slug = b.slug || '(không có)';
      const section = b.section || '(chưa gán)';
      const title = (b.title || '').substring(0, 50);
      const isCraft = /chiếu cói|đại bái|phú vinh/i.test(b.title || '');
      console.log(`- ${slug} | section=${section} | ${title}${isCraft ? ' [LÀNG NGHỀ]' : ''}`);
    }
  } finally {
    await client.close();
  }
}

check().catch(err => {
  console.error('Lỗi:', err.message);
  process.exit(1);
});
