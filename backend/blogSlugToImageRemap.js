/**
 * Remap slug → image path khi cặp trong JSON sai (ảnh lặp / sai bài).
 * Chỉ thêm slug cần sửa. Ảnh nón lá = de1, sơn mài = de0.
 */
const U = '/uploads/blogs';
const paths = {
  de0: `${U}/69afe81f31c7e3da5c6c3de0-image-1774144074043.png`, // sơn mài
  de1: `${U}/69afe81f31c7e3da5c6c3de1-image-1774144125547.png`, // nón lá
  de2: `${U}/69afe81f31c7e3da5c6c3de2-image-1774144204461.png`,
  de3: `${U}/69afe81f31c7e3da5c6c3de3-image-1774144291921.png`,
  de4: `${U}/69afe81f31c7e3da5c6c3de4-image-1774143981971.png`,
  dd9: `${U}/69afe81f31c7e3da5c6c3dd9-image-1774145384669.jpg`,
  dda: `${U}/69afe81f31c7e3da5c6c3dda-image-1774144612548.jpg`,
  ddb: `${U}/69afe81f31c7e3da5c6c3ddb-image-1774144566885.png`,
  ddc: `${U}/69afe81f31c7e3da5c6c3ddc-image-1774144406497.png`,
  ddd: `${U}/69afe81f31c7e3da5c6c3ddd-image-1774144488652.png`,
  dde: `${U}/69afe81f31c7e3da5c6c3dde-image-1774143785519.png`,
  ddf: `${U}/69afe81f31c7e3da5c6c3ddf-image-1774143885366.png`
};

// Sửa: hanh-trinh-non-la (nón lá) bị hiển thị ảnh sơn mài → dùng de1 (ảnh nón lá)
module.exports = {
  'hanh-trinh-non-la': paths.de1
};
