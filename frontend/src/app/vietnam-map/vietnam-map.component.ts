import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProductAPIService } from '../product-api.service';
import { Product } from '../../interface/Product';

interface ProvinceData {
  id: string;
  name: string;
  region: 'north' | 'central' | 'south';
  specialties: string[];
  craftVillages?: string[];
  image?: string;
  description?: string;
}

@Component({
  selector: 'app-vietnam-map',
  templateUrl: './vietnam-map.component.html',
  styleUrls: ['./vietnam-map.component.css']
})
export class VietnamMapComponent implements OnInit, AfterViewInit {
  @Input() mode: 'default' | 'about' = 'default';
  @ViewChild('svgHost', { static: true }) svgHost!: ElementRef<HTMLDivElement>;
  @ViewChild('mapImage', { static: false }) mapImage!: ElementRef<HTMLImageElement>;

  selectedProvince: ProvinceData | null = null;
  hoveredProvinceId: string = '';
  hoveredProvinceName: string = '';
  tooltipX: number = 0;
  tooltipY: number = 0;

  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading: boolean = false;

  private readonly hoverFill: string = '#9B0000';

  // Chỉ các tỉnh này mới hiện panel khi click (hover vẫn hiện tên)
  private readonly clickableProvinceIds = new Set<string>([
    'tuyen_quang', 'ha_noi', 'bac_ninh', 'thanh_hoa', 'ha_tinh', 'thua_thien_hue', 'tp_hue',
    'gia_lai', 'khanh_hoa', 'tp_ho_chi_minh', 'vinh_long', 'an_giang', 'lai_chau'
  ]);

  // Optional label overrides for known SVG IDs
  private readonly idLabelMap: Record<string, string> = {
    HCM: 'TP Hồ Chí Minh',
    HN: 'Hà Nội',
    LD: 'Lâm Đồng'
  };

  // Abbreviation-to-full-name map from SVG/JSON codes
  private readonly codeToFullName: Record<string, string> = {
    AG: 'An Giang',
    BN: 'Bắc Ninh',
    CB: 'Cao Bằng',
    CM: 'Cà Mau',
    CT: 'Cần Thơ',
    DB: 'Điện Biên',
    DL: 'Đắk Lắk',
    DN: 'Đà Nẵng',
    DT: 'Đồng Tháp',
    GL: 'Gia Lai',
    H: 'Hà Nam',
    HCM: 'TP Hồ Chí Minh',
    HP: 'Hải Phòng',
    HT: 'Hà Tĩnh',
    HY: 'Hưng Yên',
    KH: 'Khánh Hòa',
    LC: 'Lào Cai',
    LCH: 'Lai Châu',
    LD: 'Lâm Đồng',
    LS: 'Lạng Sơn',
    NA: 'Nghệ An',
    NB: 'Ninh Bình',
    PT: 'Phú Thọ',
    QN: 'Quảng Ninh',
    SL: 'Sơn La',
    TH: 'Thanh Hóa',
    TN: 'Tây Ninh',
    TQ: 'Tuyên Quang',
    VL: 'Vĩnh Long'
  };

  // Chỉ 11 tỉnh clickable: Tuyên Quang, Hà Nội, Bắc Ninh, Thanh Hóa, Hà Tĩnh, Thừa Thiên Huế, Gia Lai, Khánh Hòa, Bình Dương (TP.HCM), Vĩnh Long, An Giang
  provinces: { [key: string]: ProvinceData } = {
    'tuyen_quang': { id: 'tuyen_quang', name: 'Tuyên Quang', region: 'north', specialties: ['Bánh khảo', 'Chả lụa'], craftVillages: ['Nón lá'], image: '/assets/provinces/TuyenQuang.png', description: 'Nghề làm nón lá ở Tuyên Quang là một nét đẹp truyền thống gắn liền với đời sống văn hóa của người dân địa phương. Những chiếc nón được làm thủ công tỉ mỉ từ lá cọ, qua nhiều công đoạn như phơi lá, là lá, khâu và tạo hình. Không chỉ là vật dụng che nắng mưa, nón lá còn thể hiện sự khéo léo, cần cù của người thợ và góp phần gìn giữ bản sắc văn hóa dân tộc qua nhiều thế hệ.' },
    'ha_noi': { id: 'ha_noi', name: 'Hà Nội', region: 'north', specialties: ['Phở Hà Nội', 'Bún chả', 'Cốm Vòng'], craftVillages: ['Gốm Bát Tràng', 'Lụa Vạn Phúc', 'Tranh Hàng Trống', 'Đồng Đại Bái'], image: '/assets/provinces/HaNoi.png', description: 'Làng gốm Bát Tràng là "linh hồn" của nghề gốm Hà Nội, nơi từng thớ đất sét được thổi hồn thành những tác phẩm tinh xảo. Với lịch sử hàng trăm năm, gốm Bát Tràng không chỉ là đồ dùng mà còn là nét nghệ thuật đậm chất truyền thống, thu hút bất kỳ ai muốn khám phá vẻ đẹp văn hóa Việt.' },
    'bac_ninh': { id: 'bac_ninh', name: 'Bắc Ninh', region: 'north', specialties: ['Chả cá Kinh Bắc', 'Bánh đậu xanh'], craftVillages: ['Tranh Đông Hồ', 'Gỗ Đồng Kỵ', 'Đúc đồng Đại Bái'], image: '/assets/provinces/BacNinh.png', description: 'Làng gốm Phù Lãng là một trong những làng gốm cổ nổi tiếng ở Bắc Ninh, mang đậm vẻ đẹp mộc mạc và truyền thống. Gốm Phù Lãng gây ấn tượng với màu men nâu trầm ấm, bề mặt sần đặc trưng và kỹ thuật đắp nổi độc đáo, tạo nên những sản phẩm vừa giản dị vừa đầy tính nghệ thuật.' },
    'thanh_hoa': { id: 'thanh_hoa', name: 'Thanh Hóa', region: 'north', specialties: ['Bánh trôi', 'Cá trích'], craftVillages: ['Chiếu cói Nga Sơn', 'Mây tre đan', 'Đồ gỗ'], image: '/assets/provinces/ThanhHoa.png', description: 'Nghề làm tượng ở Thanh Hóa gắn liền với làng nghề làng đá Nhồi, nơi nổi tiếng với các sản phẩm điêu khắc đá tinh xảo. Từ những khối đá thô, người thợ khéo léo tạo nên tượng Phật, linh vật và đồ mỹ nghệ mang vẻ đẹp mạnh mẽ nhưng vẫn đầy hồn Việt, thể hiện tay nghề lâu đời và sự tỉ mỉ đáng kinh ngạc.' },
    'ha_tinh': { id: 'ha_tinh', name: 'Hà Tĩnh', region: 'central', specialties: ['Chả cá', 'Nghệ'], craftVillages: ['Nón lá', 'Mây tre đan', 'Chiếu cói'], image: 'assets/provinces/HaTinh.png', description: 'Nghề thủ công từ tre, nứa ở Hà Tĩnh gắn với nhiều làng nghề truyền thống như làng mây tre đan Thái Yên. Từ những nguyên liệu giản dị, người dân khéo léo tạo nên rổ, rá, giỏ và đồ mỹ nghệ tinh tế, vừa gần gũi đời sống vừa mang nét đẹp mộc mạc của văn hóa làng quê Việt.' },
    'thua_thien_hue': { id: 'thua_thien_hue', name: 'Thừa Thiên Huế', region: 'central', specialties: ['Bún bò Huế', 'Mè xửng'], craftVillages: ['Nón lá Huế', 'Đồ đồng Phường Đúc', 'Gốm Phước Tích'], image: 'assets/provinces/Hue.png', description: 'Nghề đan tre ở Huế nổi bật với làng nghề Bao La. Người thợ từ tre, nứa tạo nên giỏ, khay, đèn trang trí tinh xảo. Sản phẩm vừa bền đẹp, vừa mang nét thanh nhã và tinh tế đặc trưng của văn hóa xứ Huế. Nghề này không chỉ giữ gìn truyền thống mà còn thu hút du khách đến trải nghiệm và tìm hiểu.' },
    'tp_hue': { id: 'tp_hue', name: 'Thừa Thiên Huế', region: 'central', specialties: ['Bún bò Huế', 'Mè xửng'], craftVillages: ['Nón lá Huế', 'Đồ đồng Phường Đúc', 'Gốm Phước Tích'], image: 'assets/provinces/Hue.png', description: 'Nghề đan tre ở Huế nổi bật với làng nghề Bao La. Người thợ từ tre, nứa tạo nên giỏ, khay, đèn trang trí tinh xảo. Sản phẩm vừa bền đẹp, vừa mang nét thanh nhã và tinh tế đặc trưng của văn hóa xứ Huế. Nghề này không chỉ giữ gìn truyền thống mà còn thu hút du khách đến trải nghiệm và tìm hiểu.' },
    'gia_lai': { id: 'gia_lai', name: 'Gia Lai', region: 'central', specialties: ['Thịt bò khô', 'Rượu cần'], image: 'assets/provinces/GiaLai.png', description: 'Nghề làm rổ tre ở Gia Lai là một nghề truyền thống gắn liền với đời sống nông thôn. Từ tre tự nhiên, người thợ khéo léo đan thành những chiếc rổ chắc chắn, tiện dụng để chứa nông sản và đồ gia dụng. Sản phẩm vừa mang tính thực tiễn cao, vừa thể hiện nét tinh xảo và khéo léo đặc trưng của người dân Tây Nguyên.' },
    'khanh_hoa': { id: 'khanh_hoa', name: 'Khánh Hòa', region: 'central', specialties: ['Yến sào', 'Nem nướng Nha Trang'], image: 'assets/provinces/KhanhHoa.png', description: 'Nghề gốm ở Ninh Thuận và Khánh Hòa nổi bật với các làng nghề truyền thống ven biển. Người thợ khéo léo tạo ra các sản phẩm như bình, lọ, bát đĩa với men màu rực rỡ và họa tiết độc đáo. Gốm ở đây vừa phục vụ sinh hoạt, vừa mang giá trị nghệ thuật, phản ánh đời sống và văn hóa đặc trưng của miền Nam Trung Bộ.' },
    'tp_ho_chi_minh': { id: 'tp_ho_chi_minh', name: 'TP. Hồ Chí Minh', region: 'south', specialties: ['Bánh mì Sài Gòn', 'Cơm tấm', 'Hủ tiếu'], craftVillages: ['Sơn mài', 'Đồ thủ công mỹ nghệ', 'Gốm sứ'], image: 'assets/provinces/TPHCM.png', description: 'Nghề thủ công từ tre, nứa ở Bình Dương - TP.HCM rất phát triển, đặc biệt ở các làng nghề như Phú Chánh. Người thợ dùng tre, nứa để đan giỏ, rá, thúng, đồ trang trí tinh xảo. Sản phẩm vừa bền chắc, vừa mang nét mộc mạc, gần gũi, thể hiện sự khéo léo và sáng tạo của người dân địa phương.' },
    'vinh_long': { id: 'vinh_long', name: 'Vĩnh Long', region: 'south', specialties: ['Bánh tét', 'Cá tai tượng'], image: 'assets/provinces/VinhLong.png', description: 'Làng gốm Vũng Liêm là điểm nổi bật của nghề gốm ở Vĩnh Long. Người thợ từ đất sét tạo nên các sản phẩm như bình, lọ, bát đĩa với men màu tự nhiên và hoa văn giản dị nhưng tinh xảo. Gốm Vĩnh Long vừa phục vụ sinh hoạt hàng ngày, vừa mang giá trị nghệ thuật và phản ánh văn hóa đặc trưng của miền Tây sông nước.' },
    'an_giang': { id: 'an_giang', name: 'An Giang', region: 'south', specialties: ['Cá lóc nướng trui', 'Bánh xèo'], image: 'assets/provinces/AnGiang.png', description: 'Làng gốm Chợ Mới là một trong những điểm nổi bật của nghề gốm ở An Giang. Người thợ từ đất sét tạo ra các sản phẩm như bình, lọ, bát đĩa với men màu tự nhiên và họa tiết giản dị nhưng tinh tế. Gốm An Giang vừa phục vụ nhu cầu sinh hoạt, vừa mang giá trị nghệ thuật và phản ánh nét văn hóa đặc trưng miền Tây sông nước.' },
    'lai_chau': { id: 'lai_chau', name: 'Lai Châu', region: 'north', specialties: ['Măng khô', 'Cá suối'], craftVillages: ['Dệt thổ cẩm'], image: 'assets/provinces/LaiChau.png', description: 'Nghề dệt ở Lai Châu là một trong những nét văn hóa truyền thống đặc sắc của các dân tộc Tây Bắc. Người thợ sử dụng khung cửi thủ công để dệt nên các sản phẩm như vải, khăn, áo thổ cẩm với hoa văn sặc sỡ, tinh xảo. Sản phẩm dệt Lai Châu không chỉ phục vụ đời sống hàng ngày mà còn thể hiện sự khéo léo, sáng tạo và bản sắc văn hóa lâu đời của người dân địa phương.' }
  };

  private provinceNameById: Record<string, string> = {};

  private readonly craftVillagesByName: Record<string, string[]> = {
    'Hà Nội': ['Gốm Bát Tràng', 'Lụa Vạn Phúc', 'Tranh Hàng Trống', 'Đồng Đại Bái'],
    'Bắc Ninh': ['Tranh Đông Hồ', 'Gỗ Đồng Kỵ', 'Đúc đồng Đại Bái'],
    'Hưng Yên': ['Tương Bần', 'Long nhãn lồng'],
    'Ninh Bình': ['Chiếu cói Kim Sơn', 'Đá mỹ nghệ Ninh Vân', 'Thêu ren Văn Lâm'],
    'Thanh Hóa': ['Chiếu cói Nga Sơn', 'Mây tre đan', 'Đồ gỗ'],
    'Nghệ An': ['Chiếu cói', 'Mây tre đan', 'Rượu Kim Sơn'],
    'Hà Tĩnh': ['Nón lá', 'Mây tre đan', 'Chiếu cói'],
    'Thừa Thiên Huế': ['Nón lá Huế', 'Đồ đồng Phường Đúc', 'Gốm Phước Tích'],
    'TP Huế': ['Nón lá Huế', 'Đồ đồng Phường Đúc', 'Gốm Phước Tích'],
    'Quảng Nam': ['Gốm Thanh Hà', 'Lụa Mã Châu', 'Mộc Kim Bồng'],
    'Quảng Ngãi': ['Gốm', 'Đan lát', 'Chiếu cói'],
    'Đà Nẵng': ['Đồ mây tre', 'Đá mỹ nghệ'],
    'Khánh Hòa': ['Yến sào', 'Đồ mây tre'],
    'Lâm Đồng': ['Dệt thổ cẩm', 'Đồ gỗ Tây Nguyên', 'Đồ mây tre'],
    'Đồng Nai': ['Gốm', 'Mây tre đan', 'Đồ gỗ'],
    'TP. Hồ Chí Minh': ['Sơn mài', 'Đồ thủ công mỹ nghệ', 'Gốm sứ'],
    'Tây Ninh': ['Bánh tráng phơi sương', 'Đan lát', 'Đồ gỗ mỹ nghệ'],
    'Bình Dương': ['Sơn mài', 'Đồ gỗ mỹ nghệ'],
    'Long An': ['Đan lát', 'Chiếu cói'],
    'Đồng Tháp': ['Chiếu cói', 'Đan lát', 'Đồ gỗ'],
    'An Giang': ['Lụa Châu Đốc', 'Đan lát'],
    'Tiền Giang': ['Khảm sừng', 'Đồ gỗ'],
    'Vĩnh Long': ['Gốm', 'Đan lát'],
    'Cần Thơ': ['Đan lát', 'Chiếu cói'],
    'Hậu Giang': ['Đan lát', 'Đồ gỗ'],
    'Kiên Giang': ['Đan lát', 'Gốm'],
    'Cà Mau': ['Đan lát', 'Đồ mây tre'],
    'Hải Phòng': ['Gốm', 'Đan lát'],
    'Quảng Ninh': ['Than đá mỹ nghệ', 'Đồ gỗ'],
    'Lạng Sơn': ['Đồ gỗ', 'Đan lát'],
    'Thái Nguyên': ['Chè', 'Đồ thủ công'],
    'Tuyên Quang': ['Nón lá'],
    'Phú Thọ': ['Gỗ mỹ nghệ', 'Đan lát'],
    'Lào Cai': ['Thổ cẩm', 'Đồ bạc'],
    'Điện Biên': ['Thổ cẩm', 'Đồ thủ công'],
    'Gia Lai': ['Dệt thổ cẩm', 'Đồ gỗ'],
    'Đắk Lắk': ['Dệt thổ cẩm', 'Đồ gỗ', 'Đồng']
  };

  constructor(
    private productService: ProductAPIService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.loadProvinceMeta();
    this.loadAllProducts();
    if (this.provinces['bac_ninh']) {
      this.selectedProvince = this.provinces['bac_ninh'];
      this.onProvinceClick('bac_ninh');
    }
  }

  private loadProvinceMeta(): void {
    this.http.get<Array<{ id: string; name: string }>>('assets/map/vn-provinces.json').subscribe({
      next: (items) => {
        const map: Record<string, string> = {};
        items.forEach(item => {
          if (item.id && item.name) {
            const code = (item.name || '').toUpperCase();
            const full = this.codeToFullName[code] || item.name;
            map[item.id] = full;
          }
        });
        this.provinceNameById = map;
      },
      error: () => {}
    });
  }

  svgMarkup: string = '';
  svgSafeHtml: SafeHtml | null = null;
  useImageMap: boolean = true;

  // Image map base data - id phải khớp với key trong provinces
  areasBase: Array<{ id?: string; name: string; coords: number[] }> = [
    { id: 'ien_bien', name: 'Điện Biên', coords: [43,42,70,56,103,64,118,75,104,116,92,129] },
    { id: 'lai_chau', name: 'Lai Châu', coords: [88,44,64,31,56,42,50,42,134,85,132,64,107,31] },
    { id: 'lao_cai', name: 'Lào Cai', coords: [116,29,139,49,147,27,183,73,176,100,150,97,136,86] },
    { id: 'tuyen_quang', name: 'Tuyên Quang', coords: [212,13,199,22,211,49,208,81,196,94,156,32,178,14,193,2] },
    { id: 'cao_bang', name: 'Cao Bằng', coords: [269,29,204,12,200,29,222,41,252,48] },
    { id: 'son_la', name: 'Sơn La', coords: [177,106,114,72,102,128,120,134,142,123,170,134,180,129,181,126] },
    { id: 'thai_nguyen', name: 'Thái Nguyên', coords: [237,87,243,46,207,34,209,92,228,100] },
    { id: 'lang_son', name: 'Lạng Sơn', coords: [299,87,268,58,244,45,238,80,241,92,268,91,289,100] },
    { id: 'phu_tho', name: 'Phú Thọ', coords: [219,101,179,83,179,138,211,154,224,145,188,108] },
    { id: 'ninh_binh', name: 'Ninh Bình', coords: [213,152,239,173,257,155,223,132] },
    { id: 'ha_noi', name: 'Hà Nội', coords: [188,107,225,141,233,123,224,97] },
    { id: 'bac_ninh', name: 'Bắc Ninh', coords: [287,93,273,110,235,119,226,104,234,89] },
    { id: 'quang_ninh', name: 'Quảng Ninh', coords: [262,114,292,137,340,89,302,84] },
    { id: 'hai_phong', name: 'Hải Phòng', coords: [241,130,264,137,277,122,264,114,231,119] },
    { id: 'hung_yen', name: 'Hưng Yên', coords: [262,160,229,140,229,124,264,140] },
    { id: 'thanh_hoa', name: 'Thanh Hóa', coords: [216,201,234,168,188,140,155,135,152,152,180,168,198,190] },
    { id: 'nghe_an', name: 'Nghệ An', coords: [221,208,180,173,147,180,130,203,196,236,218,236] },
    { id: 'ha_tinh', name: 'Hà Tĩnh', coords: [198,262,262,274,221,231,188,239] },
    { id: 'quang_tri', name: 'Quảng Trị', coords: [277,348,302,325,257,272,203,264] },
    { id: 'tp_hue', name: 'TP Huế', coords: [333,348,292,325,279,348,297,358,310,363] },
    { id: 'a_nang', name: 'Đà Nẵng', coords: [366,394,340,366,330,350,284,373,305,399,333,411] },
    { id: 'quang_ngai', name: 'Quảng Ngãi', coords: [328,409,302,404,297,462,381,422,368,394] },
    { id: 'gia_lai', name: 'Gia Lai', coords: [389,470,378,424,297,462,307,488,338,488,356,508] },
    { id: 'ak_lak', name: 'Đắk Lắk', coords: [358,505,340,490,310,490,300,513,330,546,361,541,394,510,386,472] },
    { id: 'khanh_hoa', name: 'Khánh Hòa', coords: [371,592,353,574,363,541,394,508,383,564] },
    { id: 'lam_ong', name: 'Lâm Đồng', coords: [287,543,307,627,328,617,371,594,353,574,363,543,325,546,305,521] },
    { id: 'ong_nai', name: 'Đồng Nai', coords: [310,622,290,549,251,556,251,584,269,584,279,599,269,617,279,625,292,617] },
    { id: 'tp_ho_chi_minh', name: 'TP Hồ Chí Minh', coords: [295,617,279,625,269,615,277,597,264,579,246,584,249,607,262,632,279,643,312,625] },
    { id: 'tay_ninh', name: 'Tây Ninh', coords: [231,630,267,635,249,599,246,589,254,574,234,566,226,582,239,604,206,607] },
    { id: 'ong_thap', name: 'Đồng Tháp', coords: [277,640,229,627,203,604,190,610,213,648,241,635,274,648] },
    { id: 'vinh_long', name: 'Vĩnh Long', coords: [257,681,211,645,241,637,269,643,262,663] },
    { id: 'can_tho', name: 'Cần Thơ', coords: [257,678,229,660,208,637,190,643,208,658,201,673,226,691] },
    { id: 'an_giang', name: 'An Giang', coords: [198,683,211,658,193,640,208,637,188,607,173,627,157,632,168,648,190,655,173,663,173,676] },
    { id: 'ca_mau', name: 'Cà Mau', coords: [198,683,175,673,168,724,188,724,229,691,206,678] },
    { id: 'phu_quoc', name: 'Phú Quốc', coords: [124,625,122,650,127,663,140,660,152,630] },
    { id: 'q_hoang_sa', name: 'Q.Đ Hoàng Sa', coords: [460,284,574,310,579,350,549,386,488,394,457,363,450,330] },
    { id: 'q_truong_sa', name: 'Q.Đ Trường Sa', coords: [424,734,480,709,533,670,582,617,607,579,678,541,754,554,782,653,744,744,693,782,635,792,493,790,429,777] }
  ];
  areasScaled: Array<{ id: string; name: string; coordsStr: string }> = [];

  ngAfterViewInit(): void {
    if (this.useImageMap) {
      setTimeout(() => this.scaleAreas(), 0);
      window.addEventListener('resize', () => this.scaleAreas());
    } else {
      // Inline-load SVG to avoid <object> cross-document issues
      this.http.get('assets/New VN Maps (4).svg', { responseType: 'text' }).subscribe({
        next: (svg) => {
          this.svgMarkup = svg;
          this.svgSafeHtml = this.sanitizer.bypassSecurityTrustHtml(this.svgMarkup);
          this.cdr.detectChanges();
          // Wait for DOM to render innerHTML
          setTimeout(() => this.wireSvgInteractionsInline(), 0);
        }
      });
    }
  }

  private loadAllProducts(): void {
    this.isLoading = true;
    this.productService.getProducts(1, 200).subscribe({
      next: (data) => {
        this.products = data.products.map(p => new Product(
          p._id || '',
          p.product_name || '',
          p.product_detail || '',
          p.stocked_quantity || 0,
          p.unit_price || 0,
          p.discount || 0,
          p.createdAt || '',
          p.image_1 || '',
          p.image_2 || '',
          p.image_3 || '',
          p.image_4 || '',
          p.image_5 || '',
          p.product_dept || '',
          p.rating || 0
        ));
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private wireSvgInteractionsInline(): void {
    const host = this.svgHost?.nativeElement as HTMLDivElement | null;
    if (!host) return;
    const svg = host.querySelector('svg');
    if (!svg) return;
    const svgDoc = svg.ownerDocument as Document;

    // Collect shapes/groups that likely represent provinces (prefer groups with id)
    const groupCandidates = Array.from(svg.querySelectorAll<SVGGraphicsElement>('g[id], g[data-name]'));
    const shapeCandidates = Array.from(svg.querySelectorAll<SVGGraphicsElement>('path[id], polygon[id], rect[id]'));
    const candidates: SVGGraphicsElement[] = [...groupCandidates, ...shapeCandidates];

    // Apply alternating base colors
    const baseColors = ['#810000', '#630000'];
    let colorIndex = 0;

    candidates.forEach((el, idx) => {
      const { id: rawId, label } = this.extractProvinceIdentity(el, idx);
      const provinceId = rawId || `AUTO_${idx}`;

      const container = el.closest('g[id], g[data-name]') as SVGGraphicsElement || el;
      const shapes = Array.from(container.querySelectorAll<SVGGraphicsElement>('path, polygon, rect'));
      const targetShapes = shapes.length > 0 ? shapes : [container];

      // Tag metadata on container
      (container as any).dataset = (container as any).dataset || {};
      (container as any).dataset['provinceId'] = provinceId;
      (container as any).dataset['provinceLabel'] = label;
      (container as any).style.cursor = 'pointer';

      // Base fill for all shapes
      const chosen = baseColors[colorIndex % baseColors.length];
      colorIndex++;
      targetShapes.forEach(s => {
        const se = s as SVGElement & { style: CSSStyleDeclaration };
        if (!(se as any).dataset) (se as any).dataset = {} as any;
        if (!(se as any).dataset['originalFill']) {
          (se as any).dataset['originalFill'] = se.getAttribute('fill') || se.style.fill || '';
        }
        se.style.fill = chosen;
        se.style.pointerEvents = 'all';
        se.style.stroke = '#2e0000';
        se.style.strokeWidth = '0.5';
      });

      const onEnter = (e: Event) => {
        const me = e as MouseEvent;
        this.hoveredProvinceId = provinceId;
        this.hoveredProvinceName = label;
        targetShapes.forEach(s => {
          const se = s as SVGElement & { style: CSSStyleDeclaration };
          se.style.fill = this.hoverFill;
        });
        this.updateTooltipPosition(me);
        this.cdr.detectChanges();
      };
      const onMove = (e: Event) => {
        const me = e as MouseEvent;
        this.updateTooltipPosition(me);
        this.cdr.detectChanges();
      };
      const onLeave = () => {
        this.hoveredProvinceId = '';
        this.hoveredProvinceName = '';
        targetShapes.forEach(s => {
          const se = s as any;
          const orig = se.dataset?.originalFill;
          if (orig !== undefined) se.style.fill = orig;
        });
        this.cdr.detectChanges();
      };
      const onActivate = () => {
        const resolvedId = this.resolveSvgIdToProvinceId(provinceId, label) || provinceId;
        if (!this.clickableProvinceIds.has(resolvedId) || !this.provinces[resolvedId]) return;
        this.onProvinceClick(resolvedId);
        this.cdr.detectChanges();
      };

      container.addEventListener('mouseenter', onEnter);
      container.addEventListener('mousemove', onMove);
      container.addEventListener('mouseleave', onLeave);
      container.addEventListener('click', onActivate);
      container.addEventListener('touchstart', (e: Event) => { e.preventDefault(); onActivate(); });
    });

    // Delegated events from SVG root to catch any missed shapes
    const rootSvg = svg;
    if (rootSvg) {
      const selector = 'g[id], g[data-name], path, polygon, rect';
      const getTargetEl = (e: Event): Element | null => {
        const t = e.target as Element | null;
        return t ? (t.closest(selector) as Element | null) : null;
      };

      rootSvg.addEventListener('mouseover', (e: Event) => {
        const el = getTargetEl(e);
        if (!el) return;
        const idx = Array.from(svgDoc.querySelectorAll(selector)).indexOf(el as any);
        const { id, label } = this.extractProvinceIdentity(el, idx >= 0 ? idx : 0);
        this.hoveredProvinceId = id || `AUTO_${idx}`;
        this.hoveredProvinceName = label;
        const shapes = (el as Element).querySelectorAll('path, polygon, rect');
        if (shapes.length) {
          shapes.forEach((s: any) => {
            if (!s.dataset) s.dataset = {} as any;
            if (!s.dataset.originalFill) s.dataset.originalFill = s.getAttribute('fill') || s.style.fill || '';
            s.style.fill = this.hoverFill;
          });
        } else if ((el as any).style) {
          const anyEl = el as any;
          if (!anyEl.dataset) anyEl.dataset = {} as any;
          if (!anyEl.dataset.originalFill) anyEl.dataset.originalFill = anyEl.getAttribute?.('fill') || anyEl.style.fill || '';
          anyEl.style.fill = this.hoverFill;
        }
        this.cdr.detectChanges();
      }, true);

      rootSvg.addEventListener('mousemove', (e: Event) => {
        const me = e as MouseEvent;
        this.updateTooltipPosition(me);
        this.cdr.detectChanges();
      }, true);

      rootSvg.addEventListener('mouseout', (e: Event) => {
        const el = getTargetEl(e);
        if (!el) return;
        const shapes = (el as Element).querySelectorAll('path, polygon, rect');
        if (shapes.length) {
          shapes.forEach((s: any) => {
            const orig = s.dataset?.originalFill;
            if (orig !== undefined) s.style.fill = orig;
          });
        } else if ((el as any).style) {
          const orig = (el as any).dataset?.originalFill;
          if (orig !== undefined) (el as any).style.fill = orig;
        }
        this.hoveredProvinceId = '';
        this.hoveredProvinceName = '';
        this.cdr.detectChanges();
      }, true);

      rootSvg.addEventListener('click', (e: Event) => {
        const el = getTargetEl(e);
        if (!el) return;
        const idx = Array.from(svgDoc.querySelectorAll(selector)).indexOf(el as any);
        const { id, label } = this.extractProvinceIdentity(el, idx >= 0 ? idx : 0);
        const provinceId = this.resolveSvgIdToProvinceId(id, label) || id || `AUTO_${idx}`;
        if (!this.clickableProvinceIds.has(provinceId) || !this.provinces[provinceId]) return;
        this.onProvinceClick(provinceId);
        this.cdr.detectChanges();
      }, true);
    }

    // Dump all detected IDs/labels for mapping reference (one-time)
    this.dumpSvgIdsToConsole(svgDoc);
  }

  private scaleAreas(): void {
    const img = this.mapImage?.nativeElement;
    if (!img || !img.naturalWidth || !img.naturalHeight) {
      // Try later if image not loaded yet
      if (img) img.onload = () => this.scaleAreas();
      return;
    }
    const scaleX = img.clientWidth / img.naturalWidth;
    const scaleY = img.clientHeight / img.naturalHeight;
    this.areasScaled = this.areasBase
      .filter(a => Array.isArray(a.coords) && a.coords.length >= 6)
      .map((a, idx) => {
      const scaled: number[] = [];
      for (let i = 0; i < a.coords.length; i += 2) {
        scaled.push(Math.round(a.coords[i] * scaleX));
        scaled.push(Math.round(a.coords[i + 1] * scaleY));
      }
        const fallbackId = this.slugify(a.name) || `area_${idx}`;
        const id = a.id || fallbackId;
        return { id, name: a.name, coordsStr: scaled.join(',') };
      });
    this.cdr.detectChanges();
  }

  onAreaEnter(area: { id: string; name: string }, e: MouseEvent): void {
    this.hoveredProvinceId = area.id;
    this.hoveredProvinceName = area.name;
    this.updateTooltipPosition(e);
  }

  onAreaLeave(): void {
    this.hoveredProvinceId = '';
    this.hoveredProvinceName = '';
  }

  onAreaClick(area: { id: string; name: string }): void {
    if (!this.clickableProvinceIds.has(area.id)) return;
    const p = this.provinces[area.id];
    if (!p) return;
    this.onProvinceClick(area.id);
  }

  private resolveSvgIdToProvinceId(svgId: string, label: string): string | null {
    const codeMap: Record<string, string> = {
      TQ: 'tuyen_quang', HN: 'ha_noi', BN: 'bac_ninh', TH: 'thanh_hoa', HT: 'ha_tinh',
      GL: 'gia_lai', KH: 'khanh_hoa', HCM: 'tp_ho_chi_minh', VL: 'vinh_long', AG: 'an_giang',
      LCH: 'lai_chau'
    };
    const nameMap: Record<string, string> = {
      'Tuyên Quang': 'tuyen_quang', 'Hà Nội': 'ha_noi', 'Bắc Ninh': 'bac_ninh', 'Thanh Hóa': 'thanh_hoa',
      'Hà Tĩnh': 'ha_tinh', 'Thừa Thiên Huế': 'thua_thien_hue', 'TP Huế': 'tp_hue', 'Gia Lai': 'gia_lai',
      'Khánh Hòa': 'khanh_hoa', 'TP Hồ Chí Minh': 'tp_ho_chi_minh', 'TP. Hồ Chí Minh': 'tp_ho_chi_minh',
      'Vĩnh Long': 'vinh_long', 'An Giang': 'an_giang', 'Lai Châu': 'lai_chau'
    };
    if (svgId && codeMap[svgId.toUpperCase()]) return codeMap[svgId.toUpperCase()];
    if (label && nameMap[label]) return nameMap[label];
    const sid = label ? this.slugify(label) : '';
    return sid && this.clickableProvinceIds.has(sid) ? sid : null;
  }

  private slugify(name: string): string {
    return name
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private dumpSvgIdsToConsole(svgDoc: Document): void {
    try {
      const selector = 'g[id], g[data-name], path[id], polygon[id], rect[id]';
      const list = Array.from(svgDoc.querySelectorAll<SVGGraphicsElement>(selector));
      const results: Array<{ id: string; name: string; cx: number; cy: number }> = [];
      const seen = new Set<string>();
      list.forEach((el, idx) => {
        const { id, label } = this.extractProvinceIdentity(el, idx);
        const key = id || `AUTO_${idx}`;
        if (seen.has(key)) return;
        seen.add(key);
        const bbox = (el as any).getBBox ? (el as any).getBBox() : { x: 0, y: 0, width: 0, height: 0 };
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;
        results.push({ id: key, name: label, cx, cy });
      });
      // Sort for readability
      results.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      // Helpful copy-paste JSON in console
      // eslint-disable-next-line no-console
      console.log('[VietnamMap] Detected provinces with centers:', results);
    } catch {
      // ignore
    }
  }

  private extractProvinceIdentity(el: Element, idx: number): { id: string; label: string } {
    const idAttrRaw = el.getAttribute('id') || '';
    const idAttr = idAttrRaw;
    const titleEl = el.querySelector('title');
    const attrs = ['data-name', 'name', 'title'];
    let label = '';
    for (const a of attrs) {
      const v = el.getAttribute(a);
      if (v) { label = v; break; }
    }
    if (!label && titleEl?.textContent) label = titleEl.textContent;
    if (!label && idAttr) {
      const code = idAttr.toUpperCase();
      label = this.provinceNameById[idAttr] || this.idLabelMap[code] || this.codeToFullName[code] || idAttr;
    }
    if (!label) label = `Tỉnh/TP ${idx + 1}`;
    return { id: idAttr, label };
  }

  private findProvinceByName(name: string): ProvinceData | null {
    const normalized = name.trim().toLowerCase();
    const all = Object.values(this.provinces);
    return all.find(p => p.name.toLowerCase() === normalized || normalized.includes(p.name.toLowerCase())) || null;
  }

  private updateTooltipPosition(e: MouseEvent): void {
    // Position relative to viewport
    this.tooltipX = e.clientX + 12;
    this.tooltipY = e.clientY + 12;
  }

  onProvinceClick(provinceId: string): void {
    const province = this.provinces[provinceId] || null;
    this.selectedProvince = province;
    console.log('Province clicked:', provinceId);
    console.log('Selected province data:', province);
    console.log('Image path:', province?.image);
    
    if (!province) {
      this.filteredProducts = [];
      return;
    }

    // Only override image when province has default/fallback; keep custom images
    const currentImg = this.provinces[provinceId].image;
    const isDefaultFallback = !currentImg || currentImg.includes('HCM.jpg');
    if (isDefaultFallback) {
      this.provinces[provinceId].image = this.buildDefaultProvinceImage(province.name);
    }

    // Clear any fallback progress attributes on current image element
    setTimeout(() => {
      const imgEl = document.querySelector('.province-image') as HTMLImageElement | null;
      if (imgEl) {
        imgEl.removeAttribute('data-base-index');
        imgEl.removeAttribute('data-ext-index');
      }
    }, 0);

    const provinceNameLower = province.name.toLowerCase();
    const provinceIdLower = province.id.toLowerCase();
    this.filteredProducts = this.products.filter(p => {
      const dept = (p.product_dept || '').toLowerCase();
      return dept.includes(provinceNameLower) || dept.includes(provinceIdLower);
    });

    // Scroll panel into view on mobile
    setTimeout(() => {
      if (window.innerWidth < 768) {
        const panel = document.querySelector('.province-panel');
        panel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  }

  clearSelection(): void {
    this.selectedProvince = null;
    this.filteredProducts = [];
  }

  get displayProducts(): Product[] {
    if (this.selectedProvince && this.filteredProducts.length > 0) {
      return this.filteredProducts.slice(0, 6);
    }
    return this.products.slice(0, 6);
  }

  getProvinceName(provinceId: string): string {
    return this.provinces[provinceId]?.name || provinceId;
  }

  getRegionColor(region: string): string {
    const colors: { [key: string]: string } = {
      north: '#4A90E2',
      central: '#F39C12',
      south: '#E74C3C'
    };
    return colors[region] || '#95a5a6';
  }

  onImageError(event: any): void {
    const target: HTMLImageElement = event.target as HTMLImageElement;
    const provinceName = this.selectedProvince?.name || '';
    const baseNames = this.generateProvinceFilenameCandidates(provinceName);
    const exts = ['.jpg', '.jpeg', '.png', '.webp'];
    const baseIdxAttr = target.getAttribute('data-base-index');
    const extIdxAttr = target.getAttribute('data-ext-index');
    let baseIdx = baseIdxAttr ? parseInt(baseIdxAttr, 10) : 0;
    let extIdx = extIdxAttr ? parseInt(extIdxAttr, 10) : 0;

    // Advance to next candidate
    extIdx++;
    if (extIdx >= exts.length) {
      extIdx = 0;
      baseIdx++;
    }

    if (baseIdx < baseNames.length) {
      target.setAttribute('data-base-index', String(baseIdx));
      target.setAttribute('data-ext-index', String(extIdx));
      target.src = `/assets/provinces/${baseNames[baseIdx]}${exts[extIdx]}`;
      return;
    }

    target.removeAttribute('data-base-index');
    target.removeAttribute('data-ext-index');
    target.src = '/assets/provinces/HCM.jpg';
  }

  private buildDefaultProvinceImage(name: string): string {
    // Prefer .jpg by default; error handler will try other candidates
    const bases = this.generateProvinceFilenameCandidates(name);
    const first = bases[0] || name;
    return `/assets/provinces/${first}.jpg`;
  }

  private generateProvinceFilenameCandidates(name: string): string[] {
    const aliases: Record<string, string[]> = {
      'tp ho chi minh': ['TPHCM', 'HCM', 'TP HCM', 'TP. HCM', 'Ho Chi Minh', 'TP Hồ Chí Minh', 'TP. Hồ Chí Minh', 'HoChiMinh'],
      'ha noi': ['Hà Nội', 'Hanoi'],
      'hai phong': ['Hải Phòng', 'Haiphong'],
      'da nang': ['Đà Nẵng', 'Danang', 'DaNang'],
      'can tho': ['Cần Thơ', 'CanTho'],
      'vinh long': ['VinhLong', 'Vĩnh Long', 'Vinh Long'],
      'tp hue': ['Hue', 'Thừa Thiên Huế', 'TP Huế', 'TP. Huế', 'Huế'],
      'thua thien hue': ['Hue', 'TP Huế', 'TP. Huế', 'Huế'],
      'quang ngai': ['Quảng Ngãi', 'Quang Ngãi', 'Quảng Ngai', 'QuangNgai'],
      'khanh hoa': ['KhanhHoa', 'Khánh Hòa', 'Khanh Hòa'],
      'gia lai': ['GiaLai', 'Gia Lai'],
      'binh dinh': ['Bình Định', 'BinhDinh'],
      'ba ria  vung tau': ['Bà Rịa - Vũng Tàu', 'Ba Ria Vung Tau', 'Vũng Tàu', 'Vung Tau', 'VungTau'],
      'lang son': ['Lạng Sơn', 'Lang Sơn', 'Lang Son', 'LangSon'],
      'ha tinh': ['HaTinh', 'Hà Tĩnh', 'Ha Tĩnh', 'Ha Tinh'],
      'lai chau': ['LaiChau', 'Lai Châu', 'Lai Chau'],
      'q hoang sa': ['Q.Đ Hoàng Sa', 'QĐ Hoàng Sa', 'Q.D Hoang Sa', 'Hoàng Sa', 'Hoang Sa'],
    };

    const stripDiacritics = (s: string) => s
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/Đ/g, 'D').replace(/đ/g, 'd');
    const stripPunct = (s: string) => s.replace(/[.,/#!$%\^&*;:{}=+_`~()\-]/g, ' ');
    const normalizeSpaces = (s: string) => s.replace(/\s+/g, ' ').trim();
    const basicNormalize = (s: string) => normalizeSpaces(stripPunct(stripDiacritics(s))).toLowerCase();

    // Remove common prefixes like TP/Tỉnh/Thành phố for matching
    const removeCommonPrefixes = (s: string) => {
      const re = /^(tp\.?|tinh|tỉnh|thanh pho|thành phố)\s+/i;
      return s.replace(re, '').trim();
    };

    const compact = (s: string) => normalizeSpaces(stripDiacritics(s));
    const tight = (s: string) => compact(s).replace(/\s+/g, '');

    const baseList: string[] = [];
    const pushUnique = (v: string) => {
      if (!v) return;
      if (!baseList.includes(v)) baseList.push(v);
    };

    // Exact label first
    pushUnique(name);
    // Variants based on removing prefixes
    const nameNoPrefix = removeCommonPrefixes(name);
    if (nameNoPrefix !== name) pushUnique(nameNoPrefix);
    // No-diacritics spaced and tight
    pushUnique(compact(name));
    pushUnique(tight(name));
    if (nameNoPrefix !== name) {
      pushUnique(compact(nameNoPrefix));
      pushUnique(tight(nameNoPrefix));
    }

    // Alias lookup by normalized key
    const normKey = basicNormalize(name);
    const normKeyNoPrefix = basicNormalize(nameNoPrefix);
    const aliasSets: string[][] = [];
    Object.entries(aliases).forEach(([k, arr]) => {
      const nk = normalizeSpaces(k);
      if (nk === normKey || nk === normKeyNoPrefix) aliasSets.push(arr);
    });
    aliasSets.flat().forEach(a => {
      pushUnique(a);
      pushUnique(compact(a));
      pushUnique(tight(a));
    });

    return baseList;
  }
}


  