// Script to seed sample blogs into MongoDB
require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME || "dacsan3mien";

const sampleBlogs = [
  {
    title: '🌟 CHÈ TÂN CƯƠNG – LINH HỒN CỦA ĐẤT TRÀ THÁI NGUYÊN',
    description: 'Vùng đất Tân Cương – nơi hội tụ khí hậu và thổ nhưỡng hoàn hảo cho cây chè. Quy trình sao chè truyền thống giúp giữ hương cốm non và vị ngọt hậu độc đáo.',
    content: `Vùng đất Tân Cương, Thái Nguyên là nơi hội tụ những yếu tố tự nhiên tuyệt vời: độ cao lý tưởng, khí hậu mát mẻ, sương mù quanh năm và đất đỏ bazan màu mỡ. Tất cả tạo nên hương vị đặc trưng của chè Tân Cương - thứ trà được mệnh danh là "linh hồn của đất trà Việt Nam".

Quy trình sao chè truyền thống được truyền từ đời này sang đời khác, giúp giữ trọn hương thơm cốm non, vị ngọt thanh và màu nước trong vắt. Mỗi búp chè non được hái vào sáng sớm khi còn đọng sương, sau đó qua công đoạn sao rang tỉ mỉ trên chảo gang nóng.

Chè Tân Cương không chỉ là thức uống mà còn là nét văn hóa, là niềm tự hào của người dân Thái Nguyên. Khi thưởng thức, bạn sẽ cảm nhận được hương vị núi rừng Tây Bắc trong từng ngụm trà.`,
    image: '',
    author: 'Admin',
    published: true,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15')
  },
  {
    title: '🐟 MẮM CÁ LINH CÀ MAU – HƯƠNG VỊ MÙA NƯỚC NỔI MIỀN TÂY',
    description: 'Khi mùa nước nổi tràn về, người dân háo hức đón mùa cá linh – "lộc trời ban" của vùng sông nước. Mắm cá linh Cà Mau mang trọn hương vị đồng quê và bản sắc miền Tây.',
    content: `Mỗi năm, khi mùa nước nổi về, đồng bằng sông Cửu Long lại nhộn nhịp mùa cá linh. Loài cá nhỏ xinh này xuất hiện từ tháng 9 đến tháng 4 âm lịch, khi nước lũ từ thượng nguồn tràn về, mang theo phù sa và dinh dưỡng.

Cá linh có thịt ngọt, mềm, ít xương, rất thích hợp để làm mắm. Người dân Cà Mau có bí quyết ướp mắm riêng: cá tươi được rửa sạch, pha muối vừa phải, ủ trong chum từ 3-6 tháng. Mắm cá linh ngon phải có màu vàng óng, trong vắt, mùi thơm đặc trưng, vị ngọt thanh không tanh.

Mắm cá linh thường được dùng để nấu canh chua, kho thịt, hoặc chấm với rau sống và bánh tráng. Đây là món ăn gắn liền với văn hóa ẩm thực Nam Bộ, thể hiện sự hòa quyện giữa con người và thiên nhiên.`,
    image: '',
    author: 'Admin',
    published: true,
    createdAt: new Date('2025-01-14'),
    updatedAt: new Date('2025-01-14')
  },
  {
    title: '🐟 CÁ CƠM SẤY GIÒN NGHỆ AN – VỊ BIỂN MẶN MÀ, GIÒN TAN',
    description: 'Đặc sản tuyệt vời từ biển Cửa Lò. Từng con cá cơm nhỏ, qua công nghệ chế biến hiện đại, trở thành món ăn giòn tan, đậm vị và đầy dinh dưỡng.',
    content: `Biển Cửa Lò, Nghệ An không chỉ nổi tiếng với cảnh đẹp mà còn là nơi có nguồn cá cơm tươi ngon. Cá cơm là loài cá biển nhỏ, giàu protein và omega-3, rất tốt cho sức khỏe.

Quy trình chế biến cá cơm sấy giòn đòi hỏi sự tỉ mỉ: cá tươi được rửa sạch, ướp gia vị vừa phải, sau đó sấy khô ở nhiệt độ thích hợp để giữ nguyên dinh dưỡng và độ giòn. Sản phẩm hoàn thiện có màu vàng nâu đẹp mắt, mùi thơm hấp dẫn.

Cá cơm sấy giòn có thể ăn ngay hoặc chiên giòn, thích hợp làm món nhắm với cơm nóng, cháo, hoặc món nhậu. Đây là món quà tuyệt vời từ biển Nghệ An, mang đến hương vị đặc trưng của vùng biển Bắc Trung Bộ.`,
    image: '',
    author: 'Admin',
    published: true,
    createdAt: new Date('2025-01-13'),
    updatedAt: new Date('2025-01-13')
  },
  {
    title: '🏝️ NƯỚC MẮM PHAN THIẾT – HƯƠNG VỊ ĐẬM ĐÀ TỪ BIỂN',
    description: 'Biểu tượng của nghề biển lâu đời hơn 300 năm. Hương thơm nồng đậm, vị mặn mòi hòa quyện cùng vị ngọt hậu đặc trưng.',
    content: `Nước mắm Phan Thiết là niềm tự hào của Bình Thuận, với lịch sử phát triển hơn 300 năm. Vùng biển Phan Thiết có nguồn cá cơm tươi ngon, kết hợp với khí hậu nắng gió lý tưởng, tạo nên sản phẩm nước mắm đặc biệt.

Quy trình làm nước mắm truyền thống đòi hỏi sự kiên nhẫn: cá tươi được ướp muối theo tỷ lệ 3:1, ủ trong thùng gỗ từ 12-18 tháng. Trong thời gian này, cá lên men tự nhiên, tạo nên nước mắm có màu hổ phách trong vắt, mùi thơm đặc trưng.

Nước mắm Phan Thiết đạt chuẩn khi có độ đạm từ 30-40 độ, màu nâu đỏ đẹp, vị mặn mòi hòa quyện cùng vị ngọt thanh. Đây là gia vị không thể thiếu trong bữa ăn của người Việt, là "linh hồn" của nhiều món ăn truyền thống.`,
    image: '',
    author: 'Admin',
    published: true,
    createdAt: new Date('2025-01-12'),
    updatedAt: new Date('2025-01-12')
  },
  {
    title: '🍯 MẬT ONG MẪU SƠN – GIỌT NGỌT TINH KHIẾT TỪ ĐỈNH NÚI',
    description: 'Trên độ cao hơn 1.000 mét của dãy Mẫu Sơn, nơi sương mù bao phủ quanh năm, những đàn ong rừng tạo nên mật ong quý hiếm.',
    content: `Mẫu Sơn, Lạng Sơn là dãy núi cao với khí hậu mát mẻ quanh năm, nơi có hệ sinh thái rừng phong phú. Đây là môi trường lý tưởng cho ong rừng sinh sống và làm tổ.

Mật ong Mẫu Sơn được ong rừng thu thập từ hoa các loại thảo mộc quý hiếm mọc trên núi cao. Người dân bản địa theo truyền thống hái mật ong rừng một cách bền vững, chỉ lấy phần thừa mà ong không cần.

Mật ong Mẫu Sơn có màu vàng nâu đậm, độ đặc cao, vị ngọt thanh không gắt. Sản phẩm giàu vitamin, khoáng chất và enzym tự nhiên, rất tốt cho sức khỏe. Đặc biệt, mật ong này có hương thơm đặc trưng của hoa rừng núi cao, khác biệt hoàn toàn với mật ong nuôi thông thường.`,
    image: '',
    author: 'Admin',
    published: true,
    createdAt: new Date('2025-01-11'),
    updatedAt: new Date('2025-01-11')
  },
  {
    title: '☕ CÀ PHÊ BUÔN MA THUỘT – HƯƠNG VỊ TÂY NGUYÊN ĐẬM ĐÀ',
    description: 'Vùng đất đỏ bazan Tây Nguyên, nơi sinh ra những hạt cà phê chất lượng cao nhất Việt Nam. Cà phê Buôn Ma Thuột - niềm tự hào của đất Tây Nguyên.',
    content: `Buôn Ma Thuột, Đắk Lắk được mệnh danh là "thủ đô cà phê Việt Nam" với diện tích trồng cà phê lớn nhất cả nước. Đất đỏ bazan màu mỡ, khí hậu nhiệt đới gió mùa và độ cao 500-800m so với mực nước biển tạo nên điều kiện lý tưởng cho cây cà phê.

Cà phê Robusta Buôn Ma Thuột có hương vị đậm đà, đắng nhẹ, hậu vị ngọt thanh và hàm lượng caffein cao. Người dân Tây Nguyên có cách rang và pha cà phê truyền thống riêng biệt, tạo nên hương vị đặc trưng không lẫn với bất kỳ vùng nào.

Một ly cà phê Buôn Ma Thuột rang mộc, pha phin chậm rãi, thưởng thức cùng đá lạnh hoặc sữa đặc - đó là trải nghiệm văn hóa cà phê đích thực của Việt Nam. Cà phê không chỉ là thức uống mà còn là biểu tượng văn hóa, là niềm tự hào của người dân Tây Nguyên.`,
    image: '',
    author: 'Admin',
    published: true,
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10')
  },
  {
    title: '🍶 RƯỢU NGÔ NA HANG – HƯƠNG MEN LÁ CỦA NÚI RỪNG TUYÊN QUANG',
    description: 'Ở vùng núi Na Hang, rượu không chỉ là thức uống mà còn là linh hồn văn hóa người Tày và Dao. Rượu ngô được nấu từ ngô bản địa và men lá với 20 loại thảo mộc quý.',
    content: `Na Hang, Tuyên Quang là vùng núi cao với hệ sinh thái rừng nguyên sinh phong phú. Người dân các dân tộc Tày, Dao, Mông nơi đây có truyền thống nấu rượu men lá từ hàng trăm năm trước.

Nguyên liệu chính là ngô bản địa được trồng trên nương rẫy, kết hợp với men lá được làm từ hơn 20 loại thảo mộc quý như lá gừng, lá sa nhân, lá dong... Quy trình làm men rất công phu, được truyền từ đời này sang đời khác.

Rượu ngô Na Hang có độ cồn vừa phải (25-30 độ), màu vàng trong, hương thơm dịu nhẹ của thảo mộc hòa quyện cùng mùi ngô thơm. Vị ngọt thanh, không gắt, uống vào rất dễ chịu. Rượu ngô thường được dùng trong các dịp lễ, tết, đám cưới, là món quà quý giá thể hiện sự hiếu khách của người dân vùng cao.

Đặc biệt, rượu ngô Na Hang được uống theo kiểu "uống cạn" - một nét văn hóa độc đáo của các dân tộc Tây Bắc, thể hiện tình nghĩa và sự gắn kết cộng đồng.`,
    image: '',
    author: 'Admin',
    published: true,
    createdAt: new Date('2025-01-09'),
    updatedAt: new Date('2025-01-09')
  },
  {
    title: '🧧 SET QUÀ TẾT 3 MIỀN – TINH HOA ẨM THỰC VIỆT NAM',
    description: 'Tết đến xuân về, món quà tặng từ Bắc chí Nam, hội tụ tinh hoa ẩm thực 3 miền Bắc - Trung - Nam trong một set quà ý nghĩa.',
    content: `Tết Nguyên Đán là dịp lễ quan trọng nhất của người Việt. Việc biếu tặng quà Tết thể hiện tình cảm, sự quan tâm và lời chúc phúc tốt đẹp. Set quà Tết 3 miền được thiết kế để mang đến trọn vẹn hương vị đặc sản từ Bắc chí Nam.

**Đặc sản miền Bắc:**
- Chè Tân Cương Thái Nguyên
- Bánh đậu xanh Hải Dương
- Mật ong Mẫu Sơn Lạng Sơn

**Đặc sản miền Trung:**
- Nước mắm Phan Thiết
- Cà phê Buôn Ma Thuột
- Cá cơm sấy giòn Nghệ An

**Đặc sản miền Nam:**
- Mắm cá linh Cà Mau
- Kẹo dừa Bến Tre
- Bánh tráng trộn Tây Ninh

Mỗi sản phẩm đều được tuyển chọn kỹ lưỡng, đảm bảo chất lượng và nguồn gốc rõ ràng. Bao bì được thiết kế tinh tế, sang trọng, thích hợp làm quà biếu doanh nghiệp, người thân, bạn bè trong dịp Tết Nguyên Đán.

Set quà Tết 3 miền không chỉ là món quà vật chất mà còn là cách kết nối tình cảm, chia sẻ hương vị văn hóa Việt Nam qua những món ăn truyền thống.`,
    image: '',
    author: 'Admin',
    published: true,
    createdAt: new Date('2025-01-08'),
    updatedAt: new Date('2025-01-08')
  }
];

async function seedBlogs() {
  const client = new MongoClient(mongoUri);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully!');
    
    const database = client.db(dbName);
    const blogCollection = database.collection("Blog");
    
    // Check if there are already blogs
    const existingCount = await blogCollection.countDocuments();
    console.log(`\nCurrent number of blogs: ${existingCount}`);
    
    if (existingCount > 0) {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('\nDatabase already has blogs. Do you want to:\n1. Add more sample blogs\n2. Clear and reseed\n3. Cancel\nYour choice (1/2/3): ', resolve);
      });
      
      readline.close();
      
      if (answer === '2') {
        console.log('\nClearing existing blogs...');
        await blogCollection.deleteMany({});
        console.log('Cleared!');
      } else if (answer === '3') {
        console.log('\nOperation cancelled.');
        return;
      }
    }
    
    console.log('\nInserting sample blogs...');
    const result = await blogCollection.insertMany(sampleBlogs);
    
    console.log(`\n✅ Successfully inserted ${result.insertedCount} blogs!`);
    console.log('\n📚 Sample blogs added:');
    sampleBlogs.forEach((blog, index) => {
      console.log(`   ${index + 1}. ${blog.title}`);
    });
    
    console.log('\n✨ You can now view these blogs in the admin panel!');
    console.log('   URL: http://localhost:4200/admin/blog-adm\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Connection closed.');
  }
}

seedBlogs();

