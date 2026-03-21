/**
 * Migrate blogs:
 * - Ensure `slug` exists (generated from title if missing)
 * - Convert blog.image from base64 data URL to file URL (/uploads/blogs/...)
 *
 * Run:
 *   node migrate_blogs_slug_and_images_to_files.js
 */
require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

const { slugify } = require('./src/utils/slug');
const { persistImageMaybe } = require('./src/utils/image-storage');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'chuyenlangnghe';

async function migrate() {
  const client = new MongoClient(mongoUri);
  const uploadDirAbs = path.join(__dirname, 'src', 'public', 'uploads', 'blogs');

  try {
    await client.connect();
    const db = client.db(dbName);
    const blogCollection = db.collection('Blog');

    const cursor = blogCollection.find({}, { projection: { title: 1, slug: 1, image: 1 } });
    let scanned = 0;
    let updated = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) break;
      scanned += 1;

      const setData = {};
      if (!doc.slug && doc.title) {
        setData.slug = slugify(doc.title) || null;
      }

      if (typeof doc.image === 'string' && doc.image.startsWith('data:image/')) {
        const persisted = persistImageMaybe(doc.image, { ownerId: doc._id, field: 'image', uploadDirAbs, publicUrlBase: '/uploads/blogs' });
        if (persisted) setData.image = persisted;
      }

      if (Object.keys(setData).length > 0) {
        await blogCollection.updateOne(
          { _id: new ObjectId(doc._id) },
          { $set: { ...setData, updatedAt: new Date() } }
        );
        updated += 1;
        console.log(`Updated Blog ${String(doc._id)}: ${Object.keys(setData).join(', ')}`);
      }
    }

    console.log(`Done. Scanned: ${scanned}. Updated: ${updated}.`);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

migrate();

