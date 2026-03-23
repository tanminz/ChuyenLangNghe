/**
 * Seed sample products vào MongoDB.
 * Chạy: node seed_products.js
 * Có thể dùng --force để xóa hết và thêm lại.
 */
require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.DB_NAME || 'chuyenlangnghe';

// Ảnh mẫu từ assets frontend (path tương đối từ gốc web)
const ASSET = (name) => `/assets/${name}`;

const sampleProducts = [
  // Gốm sứ - Bát Tràng, Hà Nội
  { product_name: 'Bình gốm men ngọc Bát Tràng', product_detail: 'Bình gốm men ngọc truyền thống làng Bát Tràng, tinh xảo, cao 25cm.', stocked_quantity: 30, unit_price: 450000, discount: 0.1, product_dept: 'Hà Nội', type: 'gom_su', rating: 4.5, image_1: ASSET('grid-pottery.png'), image_2: '', image_3: '', image_4: '', image_5: '' },
  { product_name: 'Bát gốm men rạn cổ điển', product_detail: 'Bộ 6 bát gốm men rạn, phù hợp bày trí và sử dụng hàng ngày.', stocked_quantity: 50, unit_price: 280000, discount: 0, product_dept: 'Hà Nội', type: 'gom_su', rating: 4.2, image_1: ASSET('about-pot-vase.png'), image_2: '', image_3: '', image_4: '', image_5: '' },
  { product_name: 'Ấm trà gốm Chu Đậu', product_detail: 'Ấm trà gốm Chu Đậu men lam, dáng thanh thoát, dung tích 350ml.', stocked_quantity: 25, unit_price: 520000, discount: 0.15, product_dept: 'Hải Dương', type: 'gom_su', rating: 4.8, image_1: ASSET('about-artisan-pottery.png'), image_2: '', image_3: '', image_4: '', image_5: '' },
  { product_name: 'Chậu cảnh gốm sứ', product_detail: 'Chậu cảnh gốm sứ cao cấp, nhiều kích cỡ, phù hợp cây cảnh trong nhà.', stocked_quantity: 40, unit_price: 180000, discount: 0.2, product_dept: 'Hà Nội', type: 'gom_su', rating: 4.3, image_1: ASSET('catalog-sidebar-wineclay.png'), image_2: '', image_3: '', image_4: '', image_5: '' },
  { product_name: 'Lọ hoa gốm men nâu', product_detail: 'Lọ hoa gốm men nâu cổ điển, cao 30cm, trang trí hoa sen.', stocked_quantity: 20, unit_price: 380000, discount: 0.05, product_dept: 'Hà Nội', type: 'gom_su', rating: 4.6, image_1: ASSET('about-hero-pottery.png'), image_2: '', image_3: '', image_4: '', image_5: '' },
  // Tre mây - các tỉnh
  { product_name: 'Giỏ tre đan tay', product_detail: 'Giỏ tre đan thủ công, bền đẹp, nhiều kích cỡ.', stocked_quantity: 60, unit_price: 95000, discount: 0.1, product_dept: 'Hà Tĩnh', type: 'tre_may', rating: 4.4, image_1: ASSET('grid-bamboo.png'), image_2: '', image_3: '', image_4: '', image_5: '' },
  { product_name: 'Rổ rá tre mây', product_detail: 'Bộ rổ rá tre mây đan tay, phục vụ nhà bếp và trang trí.', stocked_quantity: 45, unit_price: 120000, discount: 0, product_dept: 'Hà Tĩnh', type: 'tre_may', rating: 4.1, image_1: ASSET('about-basket.png'), image_2: '', image_3: '', image_4: '', image_5: '' },
  { product_name: 'Chiếu cói truyền thống', product_detail: 'Chiếu cói đan thủ công, mát mẻ mùa hè.', stocked_quantity: 35, unit_price: 150000, discount: 0.15, product_dept: 'Ninh Bình', type: 'tre_may', rating: 4.5, image_1: ASSET('grid-mats.png'), image_2: '', image_3: '', image_4: '', image_5: '' },
  { product_name: 'Làn mây đựng đồ', product_detail: 'Làn mây đan tay, thiết kế gọn nhẹ, đa công năng.', stocked_quantity: 28, unit_price: 220000, discount: 0.2, product_dept: 'Thanh Hóa', type: 'tre_may', rating: 4.7, image_1: ASSET('grid-weaving1.png'), image_2: '', image_3: '', image_4: '', image_5: '' },
  { product_name: 'Đèn lồng tre trang trí', product_detail: 'Đèn lồng tre thủ công, tạo không gian ấm áp.', stocked_quantity: 50, unit_price: 85000, discount: 0.3, product_dept: 'Hội An', type: 'tre_may', rating: 4.6, image_1: ASSET('grid-candles.png'), image_2: '', image_3: '', image_4: '', image_5: '' },
  { product_name: 'Túi xách mây đan', product_detail: 'Túi xách mây đan tay, thời trang, thân thiện môi trường.', stocked_quantity: 22, unit_price: 290000, discount: 0.1, product_dept: 'Hà Tĩnh', type: 'tre_may', rating: 4.3, image_1: ASSET('grid-weaving2.png'), image_2: '', image_3: '', image_4: '', image_5: '' },
  // Thêm sản phẩm để đủ hiển thị
  { product_name: 'Tượng gốm nghệ nhân', product_detail: 'Tượng gốm nhỏ trang trí, tạo hình nghệ nhân làng nghề.', stocked_quantity: 15, unit_price: 350000, discount: 0.25, product_dept: 'Hà Nội', type: 'gom_su', rating: 4.9, image_1: ASSET('catalog-sidebar-crafted.png'), image_2: '', image_3: '', image_4: '', image_5: '' },
  { product_name: 'Nón lá Huế', product_detail: 'Nón lá truyền thống Huế, thủ công tinh xảo.', stocked_quantity: 80, unit_price: 75000, discount: 0, product_dept: 'Thừa Thiên Huế', type: 'tre_may', rating: 4.4, image_1: ASSET('non-la-hat.png'), image_2: '', image_3: '', image_4: '', image_5: '' },
];

function addTimestamps(arr) {
  const now = new Date();
  return arr.map(p => ({ ...p, createdAt: now, updatedAt: now }));
}

async function seedProducts() {
  const client = new MongoClient(mongoUri);

  try {
    console.log('Đang kết nối MongoDB...');
    await client.connect();
    console.log('Kết nối thành công.\n');

    const db = client.db(dbName);
    const productCollection = db.collection('Product');

    const existingCount = await productCollection.countDocuments();
    console.log(`Số sản phẩm hiện tại: ${existingCount}`);

    const forceReseed = process.argv.includes('--force') || process.argv.includes('-f');

    if (existingCount > 0) {
      if (forceReseed) {
        console.log('\n--force: Xóa toàn bộ sản phẩm cũ...');
        await productCollection.deleteMany({});
        console.log('Đã xóa.\n');
      } else {
        console.log('\nDatabase đã có sản phẩm. Dùng --force để xóa và thêm lại mẫu.');
        return;
      }
    }

    const toInsert = addTimestamps(sampleProducts);
    const result = await productCollection.insertMany(toInsert);

    console.log(`\n✅ Đã thêm ${result.insertedCount} sản phẩm mẫu!`);
    console.log('\n📦 Danh sách:');
    sampleProducts.forEach((p, i) => console.log(`   ${i + 1}. ${p.product_name} (${p.type}, ${p.product_dept})`));
    console.log('\n✨ Có thể xem tại: http://localhost:4200/catalog\n');

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

if (require.main === module) {
  seedProducts();
}

module.exports = { sampleProducts, seedProducts };
