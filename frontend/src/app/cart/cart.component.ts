import { Component, OnInit } from '@angular/core';
import { CartService } from '../services/cart.service';
import { CartItem } from '../../interface/Cart';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class CartComponent implements OnInit {
  cartItems: (CartItem & {
    isSelected: boolean;
    tempQuantity: number;
    product_name?: string;
    image_1?: string;
    stocked_quantity?: number;
  })[] = [];
  totalSelectedPrice: number = 0;

  constructor(private cartService: CartService, private router: Router) { }

  ngOnInit(): void {
    this.loadCartItems();
  }

  private loadCartItems(): void {
    this.cartService.getCartItems().subscribe((items) => {
      this.cartItems = items.map((item) => ({
        ...item,
        product_name: item.product_name || 'Queentin',
        image_1: item.image_1 || 'assets/default-image.png',
        isSelected: true,
        tempQuantity: Math.min(item.quantity, item.stocked_quantity || item.quantity),
      }));
      this.updateTotalSelectedPrice();
    });
  }

  toggleSelectAll(): void {
    this.cartItems.forEach((item) => (item.isSelected = true));
    this.updateTotalSelectedPrice();
  }

  onItemSelectChange(): void {
    this.updateTotalSelectedPrice();
  }

  confirmRemoveFromCart(productId: string | null): void {
    if (!productId) return;
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      this.removeFromCart(productId);
    }
  }

  private removeFromCart(productId: string | null): void {
    if (!productId) return;
    this.cartService.removeFromCart(productId);
    this.cartItems = this.cartItems.filter((item) => item.productId !== productId);
    this.updateTotalSelectedPrice();
  }

  increaseQuantity(item: CartItem & { isSelected: boolean; tempQuantity: number }): void {
    if (item.tempQuantity < (item.stocked_quantity || 0)) {
      item.tempQuantity += 1;
      this.updateTotalSelectedPrice();
    }
  }

  decreaseQuantity(item: CartItem & { isSelected: boolean; tempQuantity: number }): void {
    if (item.tempQuantity > 1) {
      item.tempQuantity -= 1;
      this.updateTotalSelectedPrice();
    }
  }

  updateTempQuantity(productId: string | null, quantity: number): void {
    if (!productId) return;
    const item = this.cartItems.find((item) => item.productId === productId);
    if (item) {
      item.tempQuantity = Math.min(Math.max(quantity, 1), item.stocked_quantity || 0);
      this.updateTotalSelectedPrice();
    }
  }

  saveChanges(productId: string | null): void {
    if (!productId) return;
    const item = this.cartItems.find((item) => item.productId === productId);
    if (item) {
      this.cartService.updateQuantity(productId, item.tempQuantity).subscribe(() => {
        alert('Sản phẩm đã được lưu thành công.');
        this.loadCartItems();
      });
    }
  }

  updateTotalSelectedPrice(): void {
    this.totalSelectedPrice = this.cartItems
      .filter((item) => item.isSelected)
      .reduce((total, item) => total + item.unit_price * item.tempQuantity, 0);
  }

  proceedToCheckout(): void {
    const selectedItemsList = this.cartItems.filter((item) => item.isSelected);
    if (selectedItemsList.length > 0) {
      this.cartService.saveSelectedItems(selectedItemsList);
      this.router.navigate(['/payment']);
    } else {
      alert('Vui lòng tick chọn ít nhất một sản phẩm để thanh toán.');
    }
  }
}
