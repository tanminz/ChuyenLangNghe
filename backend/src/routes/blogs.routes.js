const express = require('express');
const { ObjectId } = require('mongodb');
const path = require('path');
const { getCollections } = require('../config/database');
const { requireRoleAction } = require('../middlewares/auth');
const { persistImageMaybe } = require('../utils/image-storage');
const { slugify } = require('../utils/slug');

/** Remap slug → image path để sửa ảnh lặp / sai bài. Chỉ override khi slug khớp. */
let slugToImageRemap = {};
try {
  slugToImageRemap = require('../../blogSlugToImageRemap');
} catch (_) {}

function applyImageRemap(blog) {
  if (!blog?.slug || !slugToImageRemap[blog.slug]) return blog;
  return { ...blog, image: slugToImageRemap[blog.slug] };
}

const router = express.Router();

router.get('/', async (req, res) => {
  const { blogCollection } = getCollections();
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  try {
    const filter = { published: true };
    // Thứ tự cố định khớp layout trang /blog (featured + các cột). Sort theo createdAt khiến ảnh/tiêu đề lệch nhau.
    const blogs = await blogCollection.find(filter).sort({ _id: 1 }).skip(skip).limit(limit).toArray();
    const total = await blogCollection.countDocuments(filter);
    const blogsWithRemap = blogs.map(applyImageRemap);

    return res.status(200).json({
      blogs: blogsWithRemap,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/admin/list', requireRoleAction('admin', ['edit all', 'sales ctrl', 'view']), async (req, res) => {
  const { blogCollection } = getCollections();
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  try {
    const filter = search ? { title: { $regex: search, $options: 'i' } } : {};
    const blogs = await blogCollection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray();
    const total = await blogCollection.countDocuments(filter);

    return res.status(200).json({
      blogs,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error fetching blogs for admin:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res) => {
  const { blogCollection } = getCollections();
  const idOrSlug = req.params.id;
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(idOrSlug);
  try {
    const blog = isObjectId
      ? await blogCollection.findOne({ _id: new ObjectId(idOrSlug) })
      : await blogCollection.findOne({ slug: idOrSlug });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    return res.status(200).json(applyImageRemap(blog));
  } catch {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/', requireRoleAction('admin', ['edit all', 'sales ctrl']), async (req, res) => {
  const { blogCollection } = getCollections();
  const { title, description, content, image, author, published, slug, section } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  const validSections = ['featured_center', 'featured', 'latest', 'artisan', 'craft_village'];
  const sectionValue = validSections.includes(section) ? section : 'craft_village';

  try {
    const now = new Date();
    const slugValue = (typeof slug === 'string' && slug.trim()) ? slugify(slug) : slugify(title);
    const result = await blogCollection.insertOne({
      title,
      description: description || '',
      content,
      image: image || '',
      slug: slugValue || null,
      author: author || 'Admin',
      published: published !== undefined ? published : true,
      section: sectionValue,
      createdAt: now,
      updatedAt: now
    });

    const blogId = result.insertedId;
    const uploadDirAbs = path.join(__dirname, '..', 'public', 'uploads', 'blogs');
    const persisted = persistImageMaybe(image || '', { ownerId: blogId, field: 'image', uploadDirAbs, publicUrlBase: '/uploads/blogs' });
    if (persisted === null) {
      return res.status(400).json({ message: 'Invalid image format. Must be a data:image/* base64 or a URL.' });
    }
    if (persisted !== (image || '')) {
      await blogCollection.updateOne(
        { _id: blogId },
        { $set: { image: persisted, updatedAt: new Date() } }
      );
    }

    return res.status(201).json({ message: 'Blog created successfully', blogId });
  } catch {
    return res.status(500).json({ message: 'Failed to create blog' });
  }
});

router.patch('/:id', requireRoleAction('admin', ['edit all', 'sales ctrl']), async (req, res) => {
  const { blogCollection } = getCollections();
  const { image, title, slug, section, ...updateData } = req.body;

  try {
    const blogId = new ObjectId(req.params.id);
    const existing = await blogCollection.findOne({ _id: blogId }, { projection: { slug: 1 } });
    if (!existing) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    const setData = { ...updateData };
    if (typeof title === 'string') setData.title = title;
    const validSections = ['featured_center', 'featured', 'latest', 'artisan', 'craft_village'];
    if (validSections.includes(section)) setData.section = section;
    if (typeof slug === 'string' && slug.trim()) {
      setData.slug = slugify(slug);
    } else if (typeof title === 'string' && !existing.slug) {
      // only auto-generate slug when missing
      setData.slug = slugify(title);
    }

    if (image !== undefined) {
      if (!image) {
        setData.image = '';
      } else {
        const uploadDirAbs = path.join(__dirname, '..', 'public', 'uploads', 'blogs');
        const persisted = persistImageMaybe(image, { ownerId: blogId, field: 'image', uploadDirAbs, publicUrlBase: '/uploads/blogs' });
        if (persisted === null) {
          return res.status(400).json({ message: 'Invalid image format. Must be a data:image/* base64 or a URL.' });
        }
        setData.image = persisted;
      }
    }

    const result = await blogCollection.updateOne(
      { _id: blogId },
      { $set: { ...setData, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Blog not found or no changes made' });
    }

    return res.status(200).json({ message: 'Blog updated successfully' });
  } catch {
    return res.status(500).json({ message: 'Failed to update blog' });
  }
});

router.delete('/:id', requireRoleAction('admin', ['edit all', 'sales ctrl']), async (req, res) => {
  const { blogCollection } = getCollections();
  try {
    const result = await blogCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    return res.status(200).json({ message: 'Blog deleted successfully' });
  } catch {
    return res.status(500).json({ message: 'Failed to delete blog' });
  }
});

module.exports = router;
