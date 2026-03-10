import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

const HERO_AUTO_CHANGE_MS = 6000;

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit, OnDestroy {
  showScrollButton: boolean = false;
  currentHeroIndex = 0;
  heroAutoTimer: any;
  heroImages = [
    { src: 'assets/New web images/ss_2624665379.jpg', alt: 'Pottery craftsmanship' },
    { src: 'assets/banner-weaving.png', alt: 'Traditional weaving craftsmanship' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.fragment.subscribe();
    this.startHeroAutoChange();
  }

  startHeroAutoChange(): void {
    this.heroAutoTimer = setInterval(() => {
      this.currentHeroIndex = (this.currentHeroIndex + 1) % this.heroImages.length;
    }, HERO_AUTO_CHANGE_MS);
  }

  goToHeroSlide(index: number): void {
    this.currentHeroIndex = index;
    clearInterval(this.heroAutoTimer);
    this.startHeroAutoChange();
  }

  ngOnDestroy(): void {
    clearInterval(this.heroAutoTimer);
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.showScrollButton = window.pageYOffset > 700;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 680, behavior: 'smooth' });
  }

  goToDiscountProducts(): void {
    this.router.navigate(['/catalog'], { queryParams: { discount: 'true' } });
  }
}
