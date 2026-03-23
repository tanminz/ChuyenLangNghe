/** Phân mục hiển thị trên trang blog */
export type BlogSection =
  | 'featured_center'   // Tin nổi bật chính (center)
  | 'featured'          // Tin nổi bật (cột trái)
  | 'latest'            // Tin mới nhất (cột phải)
  | 'artisan'           // Chuyện nghệ nhân
  | 'craft_village';    // Chuyện làng nghề

export interface Blog {
  _id?: string;
  title: string;
  description: string;
  content: string;
  image: string;
  author?: string;
  /** Phân mục: chọn bài sẽ hiển thị ở đâu trên trang blog */
  section?: BlogSection;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
  published?: boolean;
}

