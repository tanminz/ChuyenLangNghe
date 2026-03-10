import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductAPIService } from '../product-api.service';
import { Product } from '../../interface/Product';

@Component({
  selector: 'app-product-page',
  templateUrl: './product-page.component.html',
  styleUrls: ['./product-page.component.css']
})
export class ProductPageComponent implements OnInit {
  product: Product | undefined;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private productService: ProductAPIService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const productId = params.get('id');
      if (productId) {
        this.loadProduct(productId);
      }
    });
  }

  loadProduct(productId: string): void {
    this.product = undefined;
    this.errorMessage = '';

    this.productService.getProductById(productId).subscribe({
      next: (data) => this.product = data,
      error: (err) => {
        this.errorMessage = "Không thể tải chi tiết sản phẩm. Vui lòng thử lại sau.";
      }
    });
  }
}
