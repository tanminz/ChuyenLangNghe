/**
 * Ghi đè trường image trong chuyenlangnghe.Blog.json theo slug → /assets/...
 * Chạy: node rewrite_blog_json_images.js
 */
const fs = require('fs');
const path = require('path');
const BLOG_IMAGE_BY_SLUG = require('./blogImageBySlug');

const jsonPath = path.join(__dirname, 'chuyenlangnghe.Blog.json');
const raw = fs.readFileSync(jsonPath, 'utf-8');
const data = JSON.parse(raw);
const blogs = Array.isArray(data) ? data : [data];

for (const blog of blogs) {
  const slug = blog.slug;
  if (slug && BLOG_IMAGE_BY_SLUG[slug]) {
    blog.image = BLOG_IMAGE_BY_SLUG[slug];
  }
}

fs.writeFileSync(jsonPath, JSON.stringify(blogs, null, 2), 'utf-8');
console.log('✅ Đã cập nhật image → /assets/... trong chuyenlangnghe.Blog.json');
