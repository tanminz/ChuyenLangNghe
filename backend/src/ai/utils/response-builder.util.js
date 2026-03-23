function formatCurrency(value) {
  if (typeof value !== 'number') {
    return 'Chua ro gia';
  }

  return `${value.toLocaleString('vi-VN')} VND`;
}

function normalizeType(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized || ['nen', 'khac', 'other', 'default'].includes(normalized)) {
    return '';
  }

  return value.trim();
}

function buildProductAnswer(products) {
  if (!products || products.length === 0) {
    return 'Hien minh chua tim thay san pham phu hop trong he thong. Ban co the noi ro hon loai san pham ban dang quan tam nhu gom trang tri, qua tang hay vat pham phong thuy.';
  }

  const intro = 'Hien he thong co mot so san pham phu hop:';
  const lines = products.slice(0, 3).map((product) => {
    const details = [
      product.product_name,
      `gia ${formatCurrency(product.unit_price)}`
    ];

    if (product.product_dept) {
      details.push(`thuoc ${product.product_dept}`);
    }

    const productType = normalizeType(product.type);
    if (productType) {
      details.push(`loai ${productType}`);
    }

    return `- ${details.join(', ')}.`;
  });

  return `${intro} ${lines.join(' ')}`.trim();
}

function buildBlogAnswer(blogs) {
  if (!blogs || blogs.length === 0) {
    return 'Hien minh chua tim thay bai viet phu hop trong he thong.';
  }

  const intro = 'Ban co the tham khao cac bai viet sau:';
  const lines = blogs.slice(0, 2).map((blog) => `- ${blog.title}.`);
  return `${intro} ${lines.join(' ')}`.trim();
}

function buildCouponAnswer(coupons) {
  if (!coupons || coupons.length === 0) {
    return 'Hien minh chua thay ma khuyen mai dang hoat dong trong he thong.';
  }

  const intro = 'Hien co mot so ma khuyen mai dang hoat dong:';
  const lines = coupons.slice(0, 2).map((coupon) => {
    const value = coupon.discountType === 'percentage'
      ? `${coupon.discountValue}%`
      : `${coupon.discountValue} VND`;
    return `- ${coupon.code}, muc giam ${value}.`;
  });

  return `${intro} ${lines.join(' ')}`.trim();
}

module.exports = {
  buildProductAnswer,
  buildBlogAnswer,
  buildCouponAnswer
};
