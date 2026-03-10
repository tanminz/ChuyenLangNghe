// Script to seed sample contacts/feedback into MongoDB
require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME || "dacsan3mien";

const sampleContacts = [
  {
    fullName: 'Nguyễn Văn An',
    email: 'nguyenvanan@gmail.com',
    phone: '0901234567',
    message: 'Xin chào, tôi muốn hỏi về đặc sản chè Tân Cương. Sản phẩm có nguồn gốc rõ ràng không? Giá bao nhiêu cho 1kg?',
    status: 'new',
    submittedAt: new Date('2025-10-26T08:30:00')
  },
  {
    fullName: 'Trần Thị Bình',
    email: 'tranthib@yahoo.com',
    phone: '0912345678',
    message: 'Cho tôi hỏi về set quà Tết 3 miền. Có thể đặt hàng số lượng lớn không? Tôi cần khoảng 50 set để biếu đối tác.',
    status: 'read',
    submittedAt: new Date('2025-10-25T14:20:00')
  },
  {
    fullName: 'Lê Hoàng Minh',
    email: 'lehoangminh@outlook.com',
    phone: '0923456789',
    message: 'Tôi đã đặt mua mắm cá linh Cà Mau nhưng chưa nhận được hàng. Mã đơn hàng #12345. Vui lòng kiểm tra giúp tôi.',
    status: 'replied',
    submittedAt: new Date('2025-10-24T10:15:00')
  },
  {
    fullName: 'Phạm Thu Hà',
    email: 'phamthuha@gmail.com',
    phone: null,
    message: 'Sản phẩm cà phê Buôn Ma Thuột có ship toàn quốc không? Chi phí vận chuyển như thế nào? Cảm ơn!',
    status: 'new',
    submittedAt: new Date('2025-10-26T09:45:00')
  },
  {
    fullName: 'Vũ Đức Thắng',
    email: 'vuducthang@hotmail.com',
    phone: '0934567890',
    message: 'Tôi rất hài lòng với chất lượng nước mắm Phan Thiết. Lần sau sẽ đặt thêm. Cảm ơn shop!',
    status: 'read',
    submittedAt: new Date('2025-10-23T16:30:00')
  },
  {
    fullName: 'Hoàng Thị Lan',
    email: 'hoanglan@gmail.com',
    phone: '0945678901',
    message: 'Xin hỏi shop có chương trình khuyến mãi nào cho mùa Tết không? Tôi muốn mua số lượng lớn làm quà biếu.',
    status: 'new',
    submittedAt: new Date('2025-10-26T11:00:00')
  },
  {
    fullName: 'Đỗ Minh Tuấn',
    email: 'dominhtuan@gmail.com',
    phone: '0956789012',
    message: 'Lạp xưởng hun khói Sa Pa có hạn sử dụng bao lâu? Bảo quản như thế nào để giữ được lâu nhất?',
    status: 'replied',
    submittedAt: new Date('2025-10-22T13:20:00')
  },
  {
    fullName: 'Bùi Thị Mai',
    email: 'buithimai@yahoo.com',
    phone: '0967890123',
    message: 'Shop có cửa hàng tại Hà Nội không? Tôi muốn đến xem trực tiếp các sản phẩm trước khi mua.',
    status: 'new',
    submittedAt: new Date('2025-10-26T07:15:00')
  }
];

async function seedContacts() {
  const client = new MongoClient(mongoUri);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully!');
    
    const database = client.db(dbName);
    const feedbackCollection = database.collection("Feedback");
    
    // Check if there are already contacts
    const existingCount = await feedbackCollection.countDocuments();
    console.log(`\nCurrent number of contacts: ${existingCount}`);
    
    if (existingCount > 0) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('\nDatabase already has contacts. Do you want to:\n1. Add more sample contacts\n2. Clear and reseed\n3. Cancel\nYour choice (1/2/3): ', resolve);
      });
      
      readline.close();
      
      if (answer === '2') {
        console.log('\nClearing existing contacts...');
        await feedbackCollection.deleteMany({});
        console.log('Cleared!');
      } else if (answer === '3') {
        console.log('\nOperation cancelled.');
        return;
      }
    }
    
    console.log('\nInserting sample contacts...');
    const result = await feedbackCollection.insertMany(sampleContacts);
    
    console.log(`\n✅ Successfully inserted ${result.insertedCount} contacts!`);
    console.log('\n📧 Sample contacts added:');
    sampleContacts.forEach((contact, index) => {
      console.log(`   ${index + 1}. ${contact.fullName} - ${contact.status.toUpperCase()}`);
    });
    
    const newCount = sampleContacts.filter(c => c.status === 'new').length;
    const readCount = sampleContacts.filter(c => c.status === 'read').length;
    const repliedCount = sampleContacts.filter(c => c.status === 'replied').length;
    
    console.log(`\n📊 Summary:`);
    console.log(`   🔴 New: ${newCount}`);
    console.log(`   🟡 Read: ${readCount}`);
    console.log(`   🟢 Replied: ${repliedCount}`);
    
    console.log('\n✨ You can now view these contacts in the admin panel!');
    console.log('   URL: http://localhost:4200/admin/contact-adm\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Connection closed.');
  }
}

seedContacts();

