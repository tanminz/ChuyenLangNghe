import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BlogAPIService } from '../blog-api.service';

export interface BlogDisplayItem {
  id: string;
  title: string;
  image: string;
  date: string;
  /** Luôn là chuỗi (có thể rỗng) để khớp template & các mảng tin */
  desc: string;
  fullContent: string;
  description?: string;
  /** Phân mục: featured_center | featured | latest | artisan | craft_village */
  section?: string;
}

/** Thứ tự slug: Center hero → Left (Tin nổi bật) → Right (Tin mới nhất) */
const BLOG_LAYOUT_SLUG_ORDER: string[] = [
  'doi-tay-nhuom-mau',        // [0] center featured
  'gom-chu-dau',              // [1-4] left column
  'giua-lang-va-pho',
  'son-mai-tuong-binh-hiep',
  'hanh-trinh-non-la',
  'nguoi-giu-lua-lo-gom',     // [5-8] right column
  'tro-ve-de-tiep-noi',
  'khong-hoan-hao',
  'bat-trang-700-nam'
];

/** Chuyện nghệ nhân: bài viết về con người, nghệ nhân cụ thể */
const ARTISAN_SLUGS: string[] = [
  'doi-tay-nhuom-mau',        // bà Lê Thị Hòa - Vạn Phúc
  'nguoi-giu-lua-lo-gom',     // ông Trần Minh - Bát Tràng
  'mot-doi-mot-nghe',         // nghệ nhân một đời một nghề
  'tro-ve-de-tiep-noi',       // bạn trẻ trở về làng
  'son-mai-tuong-binh-hiep',  // gia đình ông ba đời sơn mài
  'giu-nghe-hay-giu-ky-uc'    // nghệ nhân giữ nghề
];

/** Chuyện làng nghề: bài về làng, nghề, quy trình (không trùng ARTISAN_SLUGS) */
const CRAFT_VILLAGE_SLUGS: string[] = [
  'bat-trang-700-nam',        // làng gốm Bát Tràng
  'gom-chu-dau',              // làng gốm Chu Đậu
  'tu-dat-thanh-hinh',        // quy trình từ đất thành hình
  'khong-hoan-hao',           // triết lý thủ công
  'hanh-trinh-non-la',        // hành trình nón lá
  'giua-lang-va-pho',         // làng và phố
  'lang-chieu-coi-nga-son',   // làng chiếu cói Nga Sơn
  'lang-duc-dong-dai-bai',    // làng đúc đồng Đại Bái
  'lang-may-tre-dan-phu-vinh' // làng mây tre đan Phú Vinh
];

/** Slug bắt đầu bằng prefix này → Chuyện làng nghề (bắt mọi biến thể dài) */
const CRAFT_VILLAGE_SLUG_PREFIXES = ['lang-chieu-coi-nga-son', 'lang-duc-dong-dai-bai', 'lang-may-tre-dan-phu-vinh'];


@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent implements OnInit {
  activeBlog: string | null = null;
  /** Blog đang xem (khi mở bằng id từ API, có thể từ getBlogById) */
  activeBlogDetail: BlogDisplayItem | null = null;
  loading = true;
  /** Danh sách blog từ API (ảnh + nội dung đúng theo admin) */
  apiBlogs: BlogDisplayItem[] = [];

  featuredBlog = {
    id: 'bat-trang-700-nam',
    title: 'Bát Tràng – 700 năm giữ nghề gốm',
    description: 'Làng gốm Bát Tràng với bề dày lịch sử hơn 700 năm, nơi lưu giữ tinh hoa nghề gốm truyền thống Việt Nam. Từ những bàn tay nghệ nhân, mỗi sản phẩm gốm không chỉ là đồ dùng mà còn là tác phẩm nghệ thuật mang đậm văn hóa dân tộc.',
    image: 'assets/blog-featured-middle.png',
    date: 'ngày 25 tháng 06, 2022',
    fullContent: '<p>Làng gốm Bát Tràng (Gia Lâm, Hà Nội) có lịch sử hình thành và phát triển hơn 700 năm. Từ thế kỷ XIV–XV, cư dân từ Bồ Bát (Ninh Bình) và một số vùng khác di cư ra đây, mang theo kỹ thuật nung gốm, lập nên làng nghề bên bờ sông Hồng. Đất sét trắng, nguồn nước và khí hậu thuận lợi đã biến nơi đây thành trung tâm gốm sứ nổi tiếng của miền Bắc.</p>' +
      '<p>Nghề gốm Bát Tràng gắn liền với quy trình thủ công: chọn đất, nhào nặn, tạo hình trên bàn xoay, phơi, vẽ men, nung trong lò. Mỗi sản phẩm đều in dấu tay nghề và gu thẩm mỹ của từng nghệ nhân. Gốm Bát Tràng đa dạng: từ đồ gia dụng (bát, đĩa, ấm, chén) đến đồ thờ cúng, gốm trang trí với men rạn, men ngọc, men nâu đặc trưng.</p>' +
      '<p>Trải qua nhiều thăng trầm, làng nghề vẫn giữ được nét tinh hoa nhờ các thế hệ nghệ nhân kiên trì truyền nghề và sự quan tâm của Nhà nước trong bảo tồn di sản. Ngày nay, Bát Tràng vừa là điểm đến du lịch làng nghề, vừa là nơi sản xuất gốm sứ chất lượng cao phục vụ trong nước và xuất khẩu. Mỗi tác phẩm gốm Bát Tràng không chỉ là đồ dùng mà còn là tác phẩm nghệ thuật mang đậm văn hóa dân tộc.</p>'
  };

  /** Tin nổi bật - left column (4 items to match Tin mới nhất) */
  featuredSmall = [
    { id: 'tu-dat-thanh-hinh', title: 'Từ đất thành hình', image: 'assets/blog-image-39254299-ecd3-4e35-9639-800f9dfc1d57.png', date: 'tháng 03, 2004', fullContent: '<p>Đất, nước và lửa – ba yếu tố tạo nên gốm. Trong xưởng, nghệ nhân nhào đất sét, tạo hình trên bàn xoay, rồi đưa vào lò nung. Từ khối đất vô tri, qua bàn tay con người, dần hiện ra bình, lọ, chén bát.</p><p>Quy trình “từ đất thành hình” không chỉ là kỹ thuật mà còn là triết lý: con người đối thoại với chất liệu, chấp nhận tính bất định của đất và nhiệt, để mỗi sản phẩm vừa đạt chuẩn làng nghề vừa mang dấu ấn riêng. Lớp men, màu lửa, độ co của đất sau nung – tất cả góp phần tạo nên tác phẩm cuối cùng.</p><p>Các làng gốm truyền thống Việt Nam như Bát Tràng, Chu Đậu, Biên Hòa… đều gìn giữ cách làm ấy. Mỗi mẻ gốm ra lò là một câu chuyện về sự kiên nhẫn và tình yêu nghề.</p>' },
    { id: 'giu-nghe-hay-giu-ky-uc', title: 'Giữ nghề hay giữ ký ức?', image: 'assets/blog-image-620cef72-fb04-41e6-bbc1-a88d625d7383.png', date: 'tháng 10, 2021', fullContent: '<p>Giữa nhịp sống hiện đại, nhiều nghệ nhân vẫn chọn ở lại với lò gốm, khung cửi, bàn đục. Với họ, giữ nghề không chỉ là mưu sinh mà còn là cách giữ ký ức – ký ức của làng, của gia đình, của những bàn tay từng làm ra từng món đồ.</p><p>Khi làng nghề thu hẹp, lớp trẻ đi thành phố, câu hỏi “giữ nghề hay giữ ký ức?” trở nên day dứt. Một số nơi chọn bảo tồn nghề như di sản sống: vừa sản xuất vừa mở cửa đón khách, đào tạo thế hệ mới. Một số nơi lưu giữ ký ức qua bảo tàng, triển lãm, ghi chép. Cả hai hướng đều quý: nghề được tiếp nối thì ký ức còn chỗ bám rễ.</p><p>Trân trọng sản phẩm thủ công cũng là cách chúng ta góp phần trả lời câu hỏi ấy – để nghề và ký ức cùng tồn tại.</p>' },
    { id: 'khong-hoan-hao', title: 'Không hoàn hảo mới là thủ công', image: 'assets/blog-image-d14c99d8-0624-4fbf-95a2-b214ee73c150.png', date: 'tháng 01, 2025' },
    { id: 'mot-doi-mot-nghe', title: 'Một đời - Một nghề', image: 'assets/blog-image-e2d67ab0-8b2b-4698-a2b8-e46f77692467.png', date: 'tháng 01, 2022', fullContent: '<p>Có những người dành trọn cả cuộc đời cho một công việc duy nhất. Nghề truyền thống với họ không chỉ là kỹ năng mà còn là lựa chọn sống: gắn bó với làng, với nguyên liệu, với từng sản phẩm ra tay.</p><p>“Một đời – một nghề” là câu nói thường nghe ở các làng gốm, làng dệt, làng đúc đồng. Các cụ nghệ nhân kể lại: theo nghề từ nhỏ, lớn lên lấy vợ lấy chồng rồi cùng làm, con cháu nối nghiệp. Niềm vui nằm ở chỗ mỗi ngày được đối diện với cùng một chất liệu nhưng lại tạo ra thứ mới – không lặp lại.</p><p>Trong xã hội hiện đại, sự chuyên tâm ấy càng đáng quý. Trân trọng đồ thủ công cũng là trân trọng “một đời” ấy.</p>' }
  ];

  latestNews = [
    { id: 'doi-tay-nhuom-mau', title: 'Đôi tay nhuộm màu thời gian', image: 'assets/blog-image-a816a0d3-3229-4753-a8c7-7e7baab88866.png', date: 'tháng 01, 2026', desc: 'Câu chuyện về đôi bàn tay gắn bó với nghề qua năm tháng.', fullContent: '<p>Nghề nhuộm truyền thống gắn liền với đôi tay người thợ – tay vò vải, tay nhúng màu, tay vắt từng tấm. Màu từ thiên nhiên: củ nâu, lá chàm, vỏ cây… thấm vào vải và cả vào da tay. Đôi tay ấy “nhuộm màu” theo năm tháng, trở thành dấu ấn của nghề.</p><p>Ở nhiều làng nhuộm, phụ nữ là lực lượng chính. Họ gánh nước, đun nồi thuốc nhuộm, phơi vải. Mỗi mẻ vải ra lò phụ thuộc vào thời tiết, nhiệt độ, tỷ lệ pha chế – kinh nghiệm truyền miệng và qua thực hành. Sản phẩm không chỉ là vải nhuộm mà còn là câu chuyện về sự kiên nhẫn và tình yêu nghề.</p><p>Trân trọng vải thủ công nhuộm tự nhiên cũng là trân trọng đôi tay đã “nhuộm màu” ấy.</p>' },
    { id: 'gom-chu-dau', title: 'Gốm Chu Đậu - Hành trình trở lại', image: 'assets/blog-image-dfb21c3a-e65c-472b-baea-7e6635dd2f22.png', date: 'tháng 01, 2026', desc: 'Hành trình phục hưng dòng gốm Chu Đậu từ quá khứ.', fullContent: '<p>Gốm Chu Đậu (Nam Sách, Hải Dương) từng là dòng gốm cao cấp xuất khẩu sang Nhật Bản, Trung Đông từ thế kỷ XIV–XV. Sau thời kỳ thất truyền, nghề được phục hồi nhờ các mảnh gốm tìm thấy trong con tàu đắm và nỗ lực nghiên cứu, tái tạo của các nghệ nhân và nhà khoa học.</p><p>Gốm Chu Đậu nổi bật với men ngọc, men nâu, hoa văn tinh xảo và dáng thanh thoát. Mỗi sản phẩm phục hồi đều tuân theo quy chuẩn cổ, từ chọn đất, tạo hình đến nung và men. Làng Chu Đậu ngày nay vừa sản xuất gốm thương mại vừa bảo tồn kỹ thuật truyền thống, trở thành điểm đến của du khách và nhà sưu tầm.</p><p>Gốm Chu Đậu là minh chứng cho việc di sản có thể “sống lại” khi có sự gìn giữ và phát huy đúng hướng.</p>' },
    { id: 'son-mai-tuong-binh-hiep', title: 'Sơn mài Tương Bình Hiệp - Lớp màu của thời gian', image: 'assets/blog-image-e96eec76-0d78-44b8-881d-fd40494c5794.png', date: 'tháng 12, 2025', desc: 'Lớp sơn mài chồng lớp qua năm tháng, tạo nên vẻ đẹp độc đáo.', fullContent: '<p>Làng sơn mài Tương Bình Hiệp (Bình Dương) nổi tiếng với nghề sơn mài truyền thống. Từ gỗ, vải bồi, đến nhiều lớp sơn, mài, vẽ vàng bạc – quy trình phức tạp tạo nên sản phẩm bền đẹp, sang trọng.</p><p>Nghệ nhân Tương Bình Hiệp làm tranh sơn mài, đồ gia dụng, trang trí. Mỗi tác phẩm trải qua hàng chục công đoạn: bồi, hom, phủ sơn, mài phẳng, vẽ hoặc khảm. Sơn ta, sơn then, vàng lá, vỏ trứng… kết hợp để tạo hiệu ứng ánh vàng, ánh bạc, độ sâu. Sơn mài Tương Bình Hiệp vừa giữ nét truyền thống vừa sáng tạo mẫu mã phù hợp thị hiếu hiện đại.</p><p>Trân trọng sơn mài là trân trọng bề dày văn hóa và bàn tay tài hoa của làng nghề.</p>' },
    { id: 'hanh-trinh-non-la', title: 'Hành trình của một chiếc nón lá', image: 'assets/blog-image-63db5e9d-dc5b-4be4-be13-79c739fbdd73.png', date: 'tháng 12, 2025', desc: 'Từ lá đến nón, hành trình của nghề truyền thống.', fullContent: '<p>Nón lá Việt Nam có mặt ở khắp vùng miền: nón Huế, nón làng Chuông, nón Quảng Bình… Mỗi vùng một kiểu dáng, chất liệu và cách làm, nhưng đều gắn với hình ảnh người phụ nữ và đồng ruộng, với nắng mưa và lao động.</p><p>Hành trình làm nón bắt đầu từ chọn lá, ủ lá, là phẳng, đến khung nón, khâu từng mũi chỉ. Người thợ ngồi hàng giờ, đôi tay thoăn thoắt, tạo ra chiếc nón nhẹ, bền, che nắng che mưa. Nón lá không chỉ là vật dụng mà còn là biểu tượng văn hóa, xuất hiện trong thơ ca, âm nhạc và đời sống hàng ngày.</p><p>Mỗi chiếc nón lá là một hành trình – từ lá xanh đến sản phẩm hoàn chỉnh, từ làng nghề đến tay người dùng.</p>' }
  ];

  artisanStories = [
    { id: 'doi-tay-nhuom-mau', title: 'Đôi tay nhuộm màu thời gian', image: 'assets/blog-image-a816a0d3-3229-4753-a8c7-7e7baab88866.png', date: 'tháng 01, 2026', desc: 'Ở Vạn Phúc bà Lê Thị Hòa vẫn kiên trì ngồi bên khung cửi. Bàn tay bà đã quen với nhịp đều đặn suốt ba thập kỷ.', fullContent: '<p>Nghề nhuộm truyền thống gắn liền với đôi tay người thợ – tay vò vải, tay nhúng màu, tay vắt từng tấm. Màu từ thiên nhiên: củ nâu, lá chàm, vỏ cây… thấm vào vải và cả vào da tay. Đôi tay ấy “nhuộm màu” theo năm tháng, trở thành dấu ấn của nghề.</p><p>Ở nhiều làng nhuộm, phụ nữ là lực lượng chính. Họ gánh nước, đun nồi thuốc nhuộm, phơi vải. Mỗi mẻ vải ra lò phụ thuộc vào thời tiết, nhiệt độ, tỷ lệ pha chế – kinh nghiệm truyền miệng và qua thực hành. Sản phẩm không chỉ là vải nhuộm mà còn là câu chuyện về sự kiên nhẫn và tình yêu nghề.</p><p>Trân trọng vải thủ công nhuộm tự nhiên cũng là trân trọng đôi tay đã “nhuộm màu” ấy.</p>' },
    { id: 'son-mai-tuong-binh-hiep', title: 'Sơn mài Tương Bình Hiệp - Lớp màu của thời gian', image: 'assets/blog-image-e96eec76-0d78-44b8-881d-fd40494c5794.png', date: 'tháng 12, 2025', desc: 'Gia đình ông giữ lửa tại Tương Bình Hiệp đã ba đời làm sơn mài. Ông kể rằng để hoàn thành một tác phẩm, phải mài đến hàng chục lớp...', fullContent: '<p>Làng sơn mài Tương Bình Hiệp (Bình Dương) nổi tiếng với nghề sơn mài truyền thống. Từ gỗ, vải bồi, đến nhiều lớp sơn, mài, vẽ vàng bạc – quy trình phức tạp tạo nên sản phẩm bền đẹp, sang trọng.</p><p>Nghệ nhân Tương Bình Hiệp làm tranh sơn mài, đồ gia dụng, trang trí. Mỗi tác phẩm trải qua hàng chục công đoạn: bồi, hom, phủ sơn, mài phẳng, vẽ hoặc khảm. Sơn ta, sơn then, vàng lá, vỏ trứng… kết hợp để tạo hiệu ứng ánh vàng, ánh bạc, độ sâu. Sơn mài Tương Bình Hiệp vừa giữ nét truyền thống vừa sáng tạo mẫu mã phù hợp thị hiếu hiện đại.</p><p>Trân trọng sơn mài là trân trọng bề dày văn hóa và bàn tay tài hoa của làng nghề.</p>' },
    { id: 'nguoi-giu-lua-lo-gom', title: 'Người giữ lửa lò gốm', image: 'assets/blog-image-14fcb103-5442-4f5b-b41a-40179560049d.png', date: 'tháng 08, 2025', desc: 'Tại Bát Tràng, nghệ nhân Trần Minh đã gắn bó với lò gốm hơn 40 năm. Ông nói rằng làm gốm không chỉ là tạo hình mà là hiểu...', fullContent: '<p>Lò gốm không chỉ cần đất, nước, men – mà cần lửa. Người đốt lò phải canh nhiệt độ, thời gian, lượng củi, hướng gió. Một mẻ gốm thành công hay thất bại phụ thuộc rất lớn vào kinh nghiệm “giữ lửa” ấy.</p><p>Ở các làng gốm truyền thống, nghệ nhân giữ lửa thường là người có tuổi, đã trải qua hàng nghìn mẻ nung. Họ truyền lại bí quyết cho con cháu: khi nào tăng lửa, khi nào giữ đều, khi nào hạ nhiệt. Lửa lò gốm không chỉ nung đất thành gốm mà còn “nung” nên tình nghề và sự kế thừa.</p><p>Trân trọng gốm làng nghề cũng là trân trọng những người âm thầm giữ lửa lò.</p>' },
    { id: 'tro-ve-de-tiep-noi', title: 'Trở về để tiếp nối', image: 'assets/blog-image-53f5fb1b-b202-4137-9a5c-cd716fba7ee8.png', date: 'tháng 07, 2025', desc: 'Nhiều người về làng từ thành phố học tập, nay quay về mở xưởng nhỏ tại quê nhà.', fullContent: '<p>Nhiều bạn trẻ sinh ra ở làng nghề, lớn lên đi học, đi làm xa, rồi một ngày quyết định trở về. Họ mang theo kiến thức mới, góc nhìn mới, nhưng vẫn gắn bó với nghề của ông bà. “Trở về để tiếp nối” – không chỉ kế thừa kỹ thuật mà còn kết nối nghề với thị trường, với du lịch, với truyền thông.</p><p>Ở làng gốm, làng dệt, làng đúc… đã xuất hiện thế hệ nghệ nhân trẻ. Họ vừa giữ quy trình truyền thống vừa thử nghiệm chất liệu, mẫu mã mới. Nhờ đó, sản phẩm làng nghề không chỉ phục vụ khách địa phương mà còn đến tay bạn bè trong nước và quốc tế.</p><p>Câu chuyện “trở về để tiếp nối” là niềm hy vọng cho tương lai của làng nghề Việt Nam.</p>' }
  ];

  craftVillageStories = [
    {
      id: 'khong-hoan-hao',
      title: 'Không hoàn hảo mới là thủ công',
      image: 'assets/blog-image-d14c99d8-0624-4fbf-95a2-b214ee73c150.png',
      date: 'tháng 01, 2025',
      desc: 'Khác với sản xuất công nghiệp, mỗi sản phẩm thủ công có thể có một sai lệch nhỏ. Nhưng chính sự khác biệt đó tạo nên giá trị...',
      fullContent: '<p>Trong một xưởng gốm nhỏ ở ngoại thành, người thợ trẻ cẩn thận vuốt lại miệng bình vừa ra khỏi khuôn. Trên bề mặt đất nung vẫn còn vết tay, một đường gờ nhỏ và vài chỗ không thật tròn trịa. Nếu đó là sản phẩm công nghiệp, tất cả những “lỗi” này sẽ bị loại bỏ. Nhưng với đồ thủ công, chính những dấu vết đó lại là phần linh hồn của tác phẩm.</p><p>Khác với dây chuyền sản xuất hàng nghìn sản phẩm giống hệt nhau, mỗi món đồ thủ công bắt đầu từ một người thợ cụ thể, với nhịp thở, tâm trạng và câu chuyện riêng của họ trong ngày hôm đó. Cùng một dáng bình, cùng loại đất, cùng lò nung – nhưng mỗi sản phẩm vẫn mang một dáng vẻ hơi khác. Có chiếc hơi nghiêng sang trái, có chiếc phình bụng nhiều hơn một chút, có chiếc lại in rõ vân tay trên thân.</p><p>Những sai lệch nhỏ ấy không phải là lỗi, mà là dấu vết của quá trình tạo tác. Chúng nhắc người dùng nhớ rằng, phía sau chiếc bình, chiếc giỏ hay tấm chiếu là cả một hành trình: từ lúc chọn nguyên liệu, nhào nặn, phơi, nung, đan kết… cho đến khi hoàn thiện. Mỗi bước đều có thể xảy ra những điều “ngoài kịch bản” – và người thợ phải vừa chấp nhận, vừa đối thoại với chất liệu để đi đến kết quả cuối cùng.</p><p>Ở làng nghề, người thợ truyền cho nhau một nguyên tắc rất khác với sản xuất hàng loạt: làm cho thật đều tay, nhưng không cố xoá hết dấu ấn cá nhân. Một chiếc giỏ tre hơi chênh, một đường men gốm đậm nhạt không đều, hay một chiếc nón lá có vết khâu hơi lộ… đều có thể trở thành điểm khiến người mua nhớ mãi. Bởi họ cảm nhận được đây là “một chiếc duy nhất”, không trùng lặp với bất kỳ chiếc nào khác.</p><p>Trong bối cảnh máy móc có thể thay con người làm ra mọi thứ nhanh hơn, rẻ hơn, chính sự không hoàn hảo này lại giúp sản phẩm thủ công giữ được chỗ đứng. Người ta không tìm đến đồ thủ công vì độ chính xác tuyệt đối, mà vì cảm giác ấm áp khi cầm một vật có “hơi người” – có trọng lượng, có bề mặt, có câu chuyện. Đó là sự khác biệt mà dây chuyền tự động khó lòng tái tạo được.</p><p>Khi trân trọng một sản phẩm thủ công, chúng ta cũng đang trân trọng thời gian của người làm ra nó. Mỗi vết nứt nhỏ được người thợ vá lại bằng men, mỗi sợi mây bị gãy được khéo léo nối tiếp, mỗi đường chạm khắc không hoàn toàn đối xứng… đều là minh chứng cho sự kiên nhẫn và tay nghề. Thay vì đòi hỏi sự hoàn hảo lạnh lẽo, người dùng hôm nay dần học cách yêu những “vết xước đẹp” – nơi cái đẹp và cái chưa hoàn hảo cùng tồn tại.</p><p>Bởi vậy, khi nhìn một sản phẩm thủ công, nếu bắt gặp những điểm khác biệt nho nhỏ, hãy thử dừng lại lâu hơn một chút. Biết đâu, chính chi tiết tưởng như “lệch chuẩn” ấy lại là thứ khiến món đồ trở thành của riêng bạn – không thể thay thế bằng bất kỳ phiên bản hoàn hảo nào khác từ máy móc.</p>'
    },
    {
      id: 'giua-lang-va-pho',
      title: 'Giữa làng và phố',
      image: 'assets/blog-image-99c9a690-24cd-4c18-b4b8-4d99a47a28a3.png',
      date: 'tháng 12, 2025',
      desc: 'Làng nghề năm nay không còn khép kín. Sản phẩm thủ công đang bước vào không gian hiện đại, kết nối truyền thống với nhiều...',
      fullContent: '<p>Làng nghề nằm giữa hai thế giới: làng – nơi gốc rễ, quen thuộc, nhịp sống chậm; phố – nơi thị trường, khách hàng, thông tin. Nghệ nhân vừa phải giữ được tinh hoa làng vừa phải đối thoại với phố.</p><p>Nhiều làng nghề đã tìm cách kết nối: đưa sản phẩm lên sàn thương mại điện tử, mở cửa đón khách du lịch, tham gia hội chợ. Một số nghệ nhân trẻ sống ở phố nhưng vẫn về làng vào cuối tuần để làm nghề, hoặc mang nguyên liệu từ làng lên phố sáng tạo. “Giữa làng và phố” không còn là khoảng cách mà là cầu nối – miễn là nghề được tôn trọng và sản phẩm có chỗ đứng.</p><p>Trân trọng đồ thủ công từ làng nghề cũng là góp phần giữ nhịp cầu ấy.</p>'
    },
    {
      id: 'mot-doi-mot-nghe',
      title: 'Một đời - Một nghề',
      image: 'assets/blog-image-e2d67ab0-8b2b-4698-a2b8-e46f77692467.png',
      date: 'tháng 01, 2022',
      desc: 'Có những người dành trọn cả cuộc đời cho một công việc duy nhất. Nghề truyền thống với họ không chỉ là kỹ năng, mà là...',
      fullContent: '<p>Có những người dành trọn cả cuộc đời cho một công việc duy nhất. Nghề truyền thống với họ không chỉ là kỹ năng mà còn là lựa chọn sống: gắn bó với làng, với nguyên liệu, với từng sản phẩm ra tay.</p><p>“Một đời – một nghề” là câu nói thường nghe ở các làng gốm, làng dệt, làng đúc đồng. Các cụ nghệ nhân kể lại: theo nghề từ nhỏ, lớn lên lấy vợ lấy chồng rồi cùng làm, con cháu nối nghiệp. Niềm vui nằm ở chỗ mỗi ngày được đối diện với cùng một chất liệu nhưng lại tạo ra thứ mới – không lặp lại.</p><p>Trong xã hội hiện đại, sự chuyên tâm ấy càng đáng quý. Trân trọng đồ thủ công cũng là trân trọng “một đời” ấy.</p>'
    },
    {
      id: 'giu-nghe-hay-giu-ky-uc',
      title: 'Giữ nghề hay giữ ký ức?',
      image: 'assets/blog-image-620cef72-fb04-41e6-bbc1-a88d625d7383.png',
      date: 'tháng 10, 2021',
      desc: 'Giữa nhịp sống hiện đại, nhiều nghệ nhân vẫn chọn ở lại với lò gốm, khung cửi, bàn đục. Với họ, giữ nghề không chỉ là mưu sinh...',
      fullContent: '<p>Giữa nhịp sống hiện đại, nhiều nghệ nhân vẫn chọn ở lại với lò gốm, khung cửi, bàn đục. Với họ, giữ nghề không chỉ là mưu sinh mà còn là cách giữ ký ức – ký ức của làng, của gia đình, của những bàn tay từng làm ra từng món đồ.</p><p>Khi làng nghề thu hẹp, lớp trẻ đi thành phố, câu hỏi “giữ nghề hay giữ ký ức?” trở nên day dứt. Một số nơi chọn bảo tồn nghề như di sản sống: vừa sản xuất vừa mở cửa đón khách, đào tạo thế hệ mới. Một số nơi lưu giữ ký ức qua bảo tàng, triển lãm, ghi chép. Cả hai hướng đều quý: nghề được tiếp nối thì ký ức còn chỗ bám rễ.</p><p>Trân trọng sản phẩm thủ công cũng là cách chúng ta góp phần trả lời câu hỏi ấy – để nghề và ký ức cùng tồn tại.</p>'
    }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private blogApi: BlogAPIService
  ) {}

  /** Placeholder khi ảnh lỗi/404 */
  readonly placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"%3E%3Crect fill="%23e8ddd0" width="400" height="200"/%3E%3Ctext x="200" y="105" text-anchor="middle" fill="%237A4726" font-size="14" font-family="sans-serif"%3EKhông có ảnh%3C/text%3E%3C/svg%3E';

  trackByBlogId(_i: number, item: { id: string; image?: string }): string {
    return item.id + '|' + (item.image ?? '');
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.placeholderImage) {
      img.src = this.placeholderImage;
    }
  }

  private formatBlogDate(d: string | Date | undefined): string {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(date.getTime())) return '';
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `ngày ${day} tháng ${month}, ${year}`;
  }

  private mapApiBlogToItem(b: any): BlogDisplayItem {
    return {
      id: (b.slug || b._id || b.id || '').toString(),
      title: b.title || '',
      image: b.image || '',
      date: this.formatBlogDate(b.updatedAt || b.createdAt),
      desc: b.description || '',
      fullContent: b.content || b.fullContent || '',
      description: b.description || '',
      section: b.section
    };
  }

  /** Giữ đúng cặp ảnh–tiêu đề dù API đổi cách sort */
  private sortBlogsForLayout(items: BlogDisplayItem[]): BlogDisplayItem[] {
    return [...items].sort((a, b) => {
      const ia = BLOG_LAYOUT_SLUG_ORDER.indexOf(a.id);
      const ib = BLOG_LAYOUT_SLUG_ORDER.indexOf(b.id);
      if (ia === -1 && ib === -1) return a.title.localeCompare(b.title);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }

  private filterBySlugs(items: BlogDisplayItem[], slugs: string[]): BlogDisplayItem[] {
    const set = new Set(slugs);
    return items.filter(b => set.has(b.id)).sort((a, b) => {
      const ia = slugs.indexOf(a.id);
      const ib = slugs.indexOf(b.id);
      return ia - ib;
    });
  }

  /** Lọc theo section (từ admin). Nếu không có section thì fallback theo slug. */
  private filterBySection(items: BlogDisplayItem[], section: string, fallbackSlugs: string[]): BlogDisplayItem[] {
    const bySection = items.filter(b => b.section === section);
    if (bySection.length > 0) return bySection;
    return this.filterBySlugs(items, fallbackSlugs);
  }

  /** Chuẩn hóa bỏ dấu để so sánh (tránh lỗi Unicode) */
  private normalizeForMatch(s: string): string {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd');
  }

  /** Tiêu đề/desc chứa từ khóa làng nghề → luôn ở Chuyện làng nghề */
  private isCraftVillageByTitle(title: string, desc?: string): boolean {
    const text = [title, desc].filter(Boolean).join(' ');
    if (!text.trim()) return false;
    const t = this.normalizeForMatch(text);
    return t.includes('chieu coi nga son') || (t.includes('chieu coi') && t.includes('nga son'))
      || t.includes('duc dong dai bai') || t.includes('dai bai')
      || t.includes('may tre dan phu vinh') || (t.includes('phu vinh') && t.includes('tre'));
  }

  /** Slug thuộc Chuyện làng nghề (khớp chính xác hoặc prefix) */
  private isCraftVillageSlug(slug: string): boolean {
    if (!slug) return false;
    if (CRAFT_VILLAGE_SLUGS.includes(slug)) return true;
    return CRAFT_VILLAGE_SLUG_PREFIXES.some(p => slug.startsWith(p));
  }

  private isLayoutSlug(slug: string): boolean {
    return BLOG_LAYOUT_SLUG_ORDER.includes(slug);
  }

  /** Chuyện làng nghề: gộp theo section + slugs + match tiêu đề/desc */
  private filterCraftVillage(items: BlogDisplayItem[]): BlogDisplayItem[] {
    const bySection = items.filter(
      b => b.section === 'craft_village' && !this.isLayoutSlug(b.id) && !ARTISAN_SLUGS.includes(b.id)
    );
    const bySlug = items.filter(b => this.isCraftVillageSlug(b.id));
    const byTitle = items.filter(b => this.isCraftVillageByTitle(b.title || '', b.desc || b.description));
    const merged: BlogDisplayItem[] = [];
    const seen = new Set<string>();
    [...bySection, ...bySlug, ...byTitle].forEach(b => {
      if (!seen.has(b.id)) {
        seen.add(b.id);
        merged.push(b);
      }
    });
    return merged.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }

  /** Chuyện nghệ nhân: loại bỏ bài đã nằm trong craftVillageIds (tính từ filterCraftVillage) */
  private filterArtisan(items: BlogDisplayItem[], craftVillageIds: Set<string>): BlogDisplayItem[] {
    const exclude = (b: BlogDisplayItem) => craftVillageIds.has(b.id);
    const bySection = items.filter(b => b.section === 'artisan').filter(b => !exclude(b));
    const bySlug = this.filterBySlugs(items, ARTISAN_SLUGS).filter(b => !exclude(b));
    const merged: BlogDisplayItem[] = [];
    const seen = new Set<string>();
    [...bySection, ...bySlug].forEach(b => {
      if (!seen.has(b.id)) {
        seen.add(b.id);
        merged.push(b);
      }
    });
    return merged;
  }

  private loadBlogsFromAPI(): void {
    this.blogApi.getBlogs(1, 50).subscribe({
      next: (res: { blogs?: any[] }) => {
        const list = res.blogs || [];
        const mapped = list.map((b: any) => this.mapApiBlogToItem(b));
        this.apiBlogs = this.sortBlogsForLayout(mapped);
        if (this.apiBlogs.length > 0) {
          // featured_center: 1 bài chính
          const centerList = this.filterBySection(this.apiBlogs, 'featured_center', BLOG_LAYOUT_SLUG_ORDER.slice(0, 1));
          const center = centerList[0] || this.apiBlogs[0];
          this.featuredBlog = {
            id: center.id,
            title: center.title,
            description: center.desc || center.description || '',
            image: center.image,
            date: center.date,
            fullContent: center.fullContent || ''
          };
          // featured (cột trái), latest (cột phải) - dùng section hoặc fallback theo thứ tự
          this.featuredSmall = this.filterBySection(this.apiBlogs, 'featured', BLOG_LAYOUT_SLUG_ORDER.slice(1, 5));
          this.latestNews = this.filterBySection(this.apiBlogs, 'latest', BLOG_LAYOUT_SLUG_ORDER.slice(5, 9));
          // Tính Chuyện làng nghề trước, rồi loại trừ khỏi Chuyện nghệ nhân (tránh bài Đại Bái/Nga Sơn/Phú Vinh bị đưa nhầm)
          this.craftVillageStories = this.filterCraftVillage(this.apiBlogs);
          const craftIds = new Set(this.craftVillageStories.map(b => b.id));
          this.artisanStories = this.filterArtisan(this.apiBlogs, craftIds);
        }
        this.loading = false;
        this.resolveActiveBlogDetail();
      },
      error: () => {
        this.loading = false;
        this.resolveActiveBlogDetail();
      }
    });
  }

  activeBlogDetailLoading = false;

  /** Khi có ?id=, lấy bài từ apiBlogs hoặc gọi getBlogById để hiển thị đúng ảnh/nội dung admin đã chỉnh */
  private resolveActiveBlogDetail(): void {
    if (!this.activeBlog) {
      this.activeBlogDetail = null;
      this.activeBlogDetailLoading = false;
      return;
    }
    const fromList = this.apiBlogs.find(b => b.id === this.activeBlog);
    if (fromList) {
      this.activeBlogDetail = fromList;
      this.activeBlogDetailLoading = false;
      return;
    }
    this.activeBlogDetailLoading = true;
    this.activeBlogDetail = null;
    this.blogApi.getBlogById(this.activeBlog).subscribe({
      next: (b: any) => {
        this.activeBlogDetail = this.mapApiBlogToItem(b);
        this.activeBlogDetailLoading = false;
      },
      error: () => {
        this.activeBlogDetail = null;
        this.activeBlogDetailLoading = false;
      }
    });
  }

  ngOnInit(): void {
    this.loadBlogsFromAPI();
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.activeBlog = id;
        window.scrollTo(0, 0);
        this.resolveActiveBlogDetail();
      } else {
        this.activeBlog = null;
        this.activeBlogDetail = null;
      }
    });
  }

  showBlogDetails(blogId: string): void {
    this.activeBlog = blogId;
  }

  viewBlogDetail(blogId: string): void {
    // Scroll to top then navigate
    window.scrollTo(0, 0);
    this.router.navigate(['/blog'], { queryParams: { id: blogId } });
  }

  showBlogList(): void {
    this.router.navigate(['/blog']);
    window.scrollTo(0, 0);
  }

  /** Related posts for current detail view (3 items max) – ưu tiên từ API để đúng ảnh admin */
  getRelatedPosts(): { id: string; title: string; image: string; date: string }[] {
    if (!this.activeBlog) return [];
    const all = this.apiBlogs.length > 0
      ? this.apiBlogs
      : [
          { id: this.featuredBlog.id, title: this.featuredBlog.title, image: this.featuredBlog.image, date: this.featuredBlog.date },
          ...this.featuredSmall,
          ...this.latestNews,
          ...this.artisanStories,
          ...this.craftVillageStories
        ];
    const seen = new Set<string>();
    const unique = all.filter((b: { id: string }) => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });
    return unique.filter((b: { id: string }) => b.id !== this.activeBlog).slice(0, 3);
  }

  /** Bài đang xem: ưu tiên activeBlogDetail (từ API) để đúng ảnh/nội dung admin đã chỉnh */
  getActiveBlogItem(): { title: string; image: string; date: string; desc?: string; fullContent?: string } | null {
    if (!this.activeBlog) return null;
    if (this.activeBlogDetail) {
      return {
        title: this.activeBlogDetail.title,
        image: this.activeBlogDetail.image,
        date: this.activeBlogDetail.date,
        desc: this.activeBlogDetail.desc || this.activeBlogDetail.description,
        fullContent: this.activeBlogDetail.fullContent
      };
    }
    const fromApi = this.apiBlogs.find(b => b.id === this.activeBlog);
    if (fromApi) return { ...fromApi, desc: fromApi.desc || fromApi.description };
    if (this.featuredBlog.id === this.activeBlog) {
      return { title: this.featuredBlog.title, image: this.featuredBlog.image, date: this.featuredBlog.date, desc: this.featuredBlog.description, fullContent: (this.featuredBlog as any).fullContent };
    }
    const fromLatest = this.latestNews.find(b => b.id === this.activeBlog);
    if (fromLatest) return { ...fromLatest, desc: fromLatest.desc || fromLatest.title };
    const fromArtisan = this.artisanStories.find(b => b.id === this.activeBlog);
    if (fromArtisan) return fromArtisan;
    const fromCraft = this.craftVillageStories.find(b => b.id === this.activeBlog);
    if (fromCraft) return fromCraft;
    const fromFeaturedSmall = this.featuredSmall.find(b => b.id === this.activeBlog);
    if (fromFeaturedSmall) return { ...fromFeaturedSmall, desc: fromFeaturedSmall.title };
    return null;
  }

  isNewBlogId(): boolean {
    return !!this.getActiveBlogItem();
  }
}
