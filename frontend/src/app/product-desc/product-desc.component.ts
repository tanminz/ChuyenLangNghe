import { Component, Input, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-product-desc',
  templateUrl: './product-desc.component.html',
  styleUrls: ['./product-desc.component.css']
})
export class ProductDescComponent implements OnInit {
  @Input() product: any;
  selectedTab: string = 'description';
  reviews: { user: string; comment: string; timestamp: string; rating?: number }[] = [];
  newComment: string = '';
  isLoggedIn: boolean = false;
  userEmail: string = '';
  reviewsPerPage: number = 4;
  currentPage: number = 1;
  pagedReviews: { user: string; comment: string; timestamp: string; rating?: number }[] = [];
  sortOrder: 'newest' | 'oldest' = 'newest';
  ratingBars: { stars: number; count: number; percent: number }[] = [];

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe((status) => {
      this.isLoggedIn = status;
    });

    this.authService.getUserEmail().subscribe((email) => {
      this.userEmail = email ? `${email[0]}${email[1]}...` : 'User';
    });

    this.loadReviews();
  }

  selectTab(tab: string): void {
    this.selectedTab = tab;
  }

  addReview(): void {
    if (this.isLoggedIn && this.newComment.trim()) {
      const newReview = {
        user: this.userEmail,
        comment: this.newComment,
        timestamp: new Date().toLocaleString('vi-VN'),
        rating: 5
      };
      this.reviews.push(newReview);
      this.newComment = '';
      this.saveReviews();
      this.updateRatingBars();
      this.updatePagedReviews();
    } else {
      alert('Vui lòng đăng nhập để thêm đánh giá.');
    }
  }

  loadReviews(): void {
    const savedReviews = localStorage.getItem(`reviews_${this.product.product_name}`);
    this.reviews = savedReviews ? JSON.parse(savedReviews) : [];
    this.updateRatingBars();
    this.updatePagedReviews();
  }

  saveReviews(): void {
    localStorage.setItem(`reviews_${this.product.product_name}`, JSON.stringify(this.reviews));
  }

  getSortedReviews(): { user: string; comment: string; timestamp: string; rating?: number }[] {
    return this.sortOrder === 'newest' ? [...this.reviews].reverse() : [...this.reviews];
  }

  updatePagedReviews(): void {
    const sorted = this.getSortedReviews();
    const startIndex = (this.currentPage - 1) * this.reviewsPerPage;
    const endIndex = startIndex + this.reviewsPerPage;
    this.pagedReviews = sorted.slice(startIndex, endIndex);
  }

  updateRatingBars(): void {
    const counts = [0, 0, 0, 0, 0];
    this.reviews.forEach(r => {
      const stars = r.rating ?? 5;
      if (stars >= 1 && stars <= 5) counts[Math.round(stars) - 1]++;
    });
    const total = this.reviews.length || 1;
    this.ratingBars = [5, 4, 3, 2, 1].map(s => ({
      stars: s,
      count: counts[s - 1],
      percent: total ? (counts[s - 1] / total) * 100 : 0
    }));
  }

  applySort(): void {
    this.currentPage = 1;
    this.updatePagedReviews();
  }

  getAverageRating(): number {
    if (!this.reviews.length) return 0;
    const sum = this.reviews.reduce((a, r) => a + (r.rating ?? 5), 0);
    return sum / this.reviews.length;
  }

  getInitials(name: string): string {
    const parts = name.replace(/[^a-zA-ZÀ-ỹ\s]/g, '').split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] || '') + (parts[1][0] || '');
    return (name[0] || 'U').toUpperCase();
  }

  getStartIndex(): number {
    return this.reviews.length ? (this.currentPage - 1) * this.reviewsPerPage + 1 : 0;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.reviewsPerPage, this.reviews.length);
  }

  get totalPages(): number {
    return Math.ceil(this.reviews.length / this.reviewsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagedReviews();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagedReviews();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePagedReviews();
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index + 1);
  }
}
