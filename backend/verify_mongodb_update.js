const { MongoClient } = require('mongodb');
require('dotenv').config();

// Cấu hình kết nối MongoDB
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME || "chuyenlangnghe";
const collectionName = "Product";

async function verifyMongoDBUpdate() {
  const client = new MongoClient(mongoUri);
  
  try {
    console.log('🔌 Đang kết nối MongoDB...');
    await client.connect();
    console.log('✅ Kết nối MongoDB thành công');
    
    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    
    // Lấy tất cả sản phẩm
    console.log('📦 Đang lấy danh sách sản phẩm...');
    const products = await collection.find({}).toArray();
    console.log(`📊 Tổng số sản phẩm: ${products.length}`);
    
    // Kiểm tra trường type
    const productsWithType = products.filter(p => p.type);
    const productsWithoutType = products.filter(p => !p.type);
    
    console.log(`✅ Sản phẩm có trường type: ${productsWithType.length}`);
    console.log(`❌ Sản phẩm thiếu trường type: ${productsWithoutType.length}`);
    
    if (productsWithoutType.length > 0) {
      console.log('\n⚠️  Các sản phẩm thiếu trường type:');
      productsWithoutType.slice(0, 5).forEach((product, index) => {
        console.log(`${index + 1}. ${product.product_name} (dept: ${product.product_dept || 'N/A'})`);
      });
    }
    
    // Thống kê theo type
    const typeStats = {};
    productsWithType.forEach(product => {
      const type = product.type || 'unknown';
      typeStats[type] = (typeStats[type] || 0) + 1;
    });
    
    console.log('\n📊 Thống kê phân loại sản phẩm:');
    Object.entries(typeStats).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} sản phẩm`);
    });
    
    // Hiển thị mẫu sản phẩm
    console.log('\n📋 Mẫu sản phẩm với trường type:');
    productsWithType.slice(0, 10).forEach((product, index) => {
      console.log(`${index + 1}. ${product.product_name} -> type: ${product.type}`);
    });
    
    // Kiểm tra một số sản phẩm cụ thể
    console.log('\n🔍 Kiểm tra chi tiết một số sản phẩm:');
    const sampleProducts = await collection.find({}).limit(5).toArray();
    sampleProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.product_name}`);
      console.log(`   - product_dept: ${product.product_dept || 'N/A'}`);
      console.log(`   - type: ${product.type || 'N/A'}`);
      console.log(`   - product_name: ${product.product_name}`);
      console.log('');
    });
    
    console.log('🎉 Xác minh hoàn tất!');
    
  } catch (error) {
    console.error('❌ Lỗi khi xác minh:', error);
  } finally {
    await client.close();
    console.log('🔌 Đã đóng kết nối MongoDB');
  }
}

// Chạy script
console.log('🚀 Bắt đầu xác minh cập nhật MongoDB...\n');
verifyMongoDBUpdate();
