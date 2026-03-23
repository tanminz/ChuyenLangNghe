const { getCollections } = require('../../config/database');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractKeywords(question) {
  const normalized = (question || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ');

  return Array.from(new Set(
    normalized
      .split(/\s+/)
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length >= 2)
      .slice(0, 8)
  ));
}

function buildKeywordRegex(keywords) {
  if (keywords.length === 0) {
    return null;
  }
  return new RegExp(keywords.map(escapeRegex).join('|'), 'i');
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getPreferredTags(normalizedQuestion) {
  const tagGroups = {
    gom: ['gom', 'su', 'ceramic', 'bat trang', 'chau', 'binh', 'lo hoa'],
    tre: ['tre', 'may', 'dan', 'moc tre'],
    tuong: ['tuong', 'phong thuy', 'linh vat'],
    lich: ['lich', 'de ban', 'calendar']
  };

  return Object.values(tagGroups)
    .filter((group) => group.some((tag) => normalizedQuestion.includes(tag)))
    .flat();
}

function getExcludedTerms(normalizedQuestion) {
  const excluded = new Set();
  const patterns = [
    /khong phai\s+([a-z0-9\s]{2,30})/g,
    /khong muon\s+([a-z0-9\s]{2,30})/g,
    /tru\s+([a-z0-9\s]{2,30})/g
  ];

  patterns.forEach((pattern) => {
    let match = pattern.exec(normalizedQuestion);
    while (match) {
      match[1]
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2)
        .forEach((token) => excluded.add(token));
      match = pattern.exec(normalizedQuestion);
    }
  });

  return Array.from(excluded);
}

function scoreProduct(product, normalizedQuestion, keywords, preferredTags, excludedTerms) {
  const searchable = normalizeText([
    product.product_name,
    product.product_detail,
    product.product_dept,
    product.type
  ].join(' '));

  if (!searchable) {
    return -1;
  }

  if (excludedTerms.some((term) => searchable.includes(term))) {
    return -1;
  }

  if (preferredTags.length > 0 && !preferredTags.some((tag) => searchable.includes(tag))) {
    return -1;
  }

  let score = 0;
  keywords.forEach((keyword) => {
    if (!keyword || keyword === 'khong') return;
    if (searchable.includes(keyword)) score += 2;
  });

  preferredTags.forEach((tag) => {
    if (searchable.includes(tag)) score += 4;
  });

  const productName = normalizeText(product.product_name);
  keywords.forEach((keyword) => {
    if (productName.includes(keyword)) score += 1;
  });

  if (normalizedQuestion.includes('qua tang') && searchable.includes('qua tang')) {
    score += 2;
  }

  return score;
}

async function searchProducts(question, limit = 3) {
  const { productCollection } = getCollections();
  const keywords = extractKeywords(question);
  const normalizedQuestion = normalizeText(question);
  const preferredTags = getPreferredTags(normalizedQuestion);
  const excludedTerms = getExcludedTerms(normalizedQuestion);
  const keywordRegex = buildKeywordRegex(
    keywords.filter((keyword) => !['toi', 'muon', 'ban', 'mua', 'nua', 'nhe', 'voi', 'cho', 'me'].includes(keyword))
  );
  const filter = keywordRegex
    ? {
        $or: [
          { product_name: keywordRegex },
          { product_detail: keywordRegex },
          { product_dept: keywordRegex },
          { type: keywordRegex }
        ]
      }
    : {};

  const candidates = await productCollection
    .find(filter)
    .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
    .limit(80)
    .project({
      product_name: 1,
      product_detail: 1,
      product_dept: 1,
      type: 1,
      unit_price: 1,
      discount: 1,
      stocked_quantity: 1,
      rating: 1
    })
    .toArray();

  const ranked = candidates
    .map((product) => ({
      product,
      score: scoreProduct(product, normalizedQuestion, keywords, preferredTags, excludedTerms)
    }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.product);

  return ranked;
}

async function searchBlogs(question, limit = 2) {
  const { blogCollection } = getCollections();
  const keywords = extractKeywords(question);
  const keywordRegex = buildKeywordRegex(keywords);
  const filter = keywordRegex
    ? {
        published: true,
        $or: [
          { title: keywordRegex },
          { description: keywordRegex },
          { content: keywordRegex }
        ]
      }
    : { published: true };

  return blogCollection
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .project({
      title: 1,
      description: 1,
      content: 1
    })
    .toArray();
}

async function searchCoupons(question, limit = 2) {
  const { couponCollection } = getCollections();
  const keywords = extractKeywords(question);
  const wantsCouponInfo = keywords.some((keyword) => ['khuyen', 'mai', 'giam', 'gia', 'coupon', 'ma', 'sale'].includes(keyword));

  if (!wantsCouponInfo) {
    return [];
  }

  return couponCollection
    .find({ isActive: true })
    .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
    .limit(limit)
    .project({
      code: 1,
      discountType: 1,
      discountValue: 1,
      isActive: 1
    })
    .toArray();
}

module.exports = {
  searchProducts,
  searchBlogs,
  searchCoupons
};
