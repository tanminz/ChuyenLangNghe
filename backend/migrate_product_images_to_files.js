/**
 * Migrate product images from base64 data URLs to file URLs.
 *
 * - Reads Product collection.
 * - For each product, converts image_1..image_5 if value starts with "data:image/".
 * - Saves files to: backend/src/public/uploads/products/
 * - Updates product fields to "/uploads/products/<filename>"
 *
 * Run:
 *   node migrate_product_images_to_files.js
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');
const path = require('path');

const { persistImageMaybe } = require('./src/utils/image-storage');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'dacsan3mien';

async function migrate() {
  const client = new MongoClient(mongoUri);
  const uploadDirAbs = path.join(__dirname, 'src', 'public', 'uploads', 'products');

  try {
    await client.connect();
    const db = client.db(dbName);
    const productCollection = db.collection('Product');

    const cursor = productCollection.find({}, { projection: { image_1: 1, image_2: 1, image_3: 1, image_4: 1, image_5: 1 } });
    let scanned = 0;
    let updated = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (!doc) break;
      scanned += 1;

      const updates = {};
      const fields = ['image_1', 'image_2', 'image_3', 'image_4', 'image_5'];

      for (const field of fields) {
        const val = doc[field];
        if (typeof val === 'string' && val.startsWith('data:image/')) {
          const persisted = persistImageMaybe(val, { ownerId: doc._id, field, uploadDirAbs, publicUrlBase: '/uploads/products' });
          if (persisted) {
            updates[field] = persisted;
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        await productCollection.updateOne(
          { _id: doc._id },
          { $set: { ...updates, updatedAt: new Date() } }
        );
        updated += 1;
        console.log(`Updated ${String(doc._id)}: ${Object.keys(updates).join(', ')}`);
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

