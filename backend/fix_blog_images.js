/**
 * Cập nhật đường dẫn ảnh blog trong MongoDB - khớp đúng tiêu đề với ảnh.
 * Luôn dùng mapping slug -> asset để đảm bảo ảnh đúng với nội dung bài viết.
 * Chạy: node fix_blog_images.js
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'chuyenlangnghe';

const SLUG_TO_ASSET = {
  'bat-trang-700-nam': '/assets/blog-featured-middle.png',
  'tu-dat-thanh-hinh': '/assets/blog-image-39254299-ecd3-4e35-9639-800f9dfc1d57.png',
  'giu-nghe-hay-giu-ky-uc': '/assets/blog-image-620cef72-fb04-41e6-bbc1-a88d625d7383.png',
  'khong-hoan-hao': '/assets/blog-image-d14c99d8-0624-4fbf-95a2-b214ee73c150.png',
  'mot-doi-mot-nghe': '/assets/blog-image-e2d67ab0-8b2b-4698-a2b8-e46f77692467.png',
  'doi-tay-nhuom-mau': '/assets/blog-image-a816a0d3-3229-4753-a8c7-7e7baab88866.png',
  'gom-chu-dau': '/assets/blog-image-dfb21c3a-e65c-472b-baea-7e6635dd2f22.png',
  'son-mai-tuong-binh-hiep': '/assets/blog-image-e96eec76-0d78-44b8-881d-fd40494c5794.png',
  'hanh-trinh-non-la': '/assets/blog-image-63db5e9d-dc5b-4be4-be13-79c739fbdd73.png',
  'nguoi-giu-lua-lo-gom': '/assets/blog-image-14fcb103-5442-4f5b-b41a-40179560049d.png',
  'tro-ve-de-tiep-noi': '/assets/blog-image-53f5fb1b-b202-4137-9a5c-cd716fba7ee8.png',
  'giua-lang-va-pho': '/assets/blog-image-99c9a690-24cd-4c18-b4b8-4d99a47a28a3.png'
};

async function fixBlogImages() {
  const client = new MongoClient(mongoUri);

  try {
    console.log('Đang kết nối MongoDB...');
    await client.connect();

    const db = client.db(dbName);
    const blogCollection = db.collection('Blog');
    const blogs = await blogCollection.find({}).toArray();

    console.log(`\nTìm thấy ${blogs.length} blog. Cập nhật ảnh theo slug...\n`);

    let updated = 0;
    for (const blog of blogs) {
      const slug = blog.slug || '';
      const assetPath = SLUG_TO_ASSET[slug];

      if (!assetPath) {
        console.log(`  [skip]   ${blog.title} (slug "${slug}" không có mapping)`);
        continue;
      }

      await blogCollection.updateOne(
        { _id: blog._id },
        { $set: { image: assetPath, updatedAt: new Date() } }
      );
      console.log(`  [OK] ${blog.title} -> ${assetPath}`);
      updated++;
    }

    console.log(`\n✅ Đã cập nhật ${updated} blog. Ảnh đã khớp đúng với tiêu đề.\n`);

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

fixBlogImages();
