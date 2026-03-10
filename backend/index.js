require('dotenv').config();
const express = require('express');
const morgan = require("morgan");
const cors = require("cors");
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3002;

app.use(morgan("combined"));
app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || "mongodb://root:password@localhost:27017",
    dbName: process.env.DB_NAME || 'dacsan3mien',
    collectionName: 'sessions',
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use((req, res, next) => {
  next();
});

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const client = new MongoClient(mongoUri);
let productCollection, userCollection, orderCollection, feedbackCollection, cartCollection, blogCollection, productReviewCollection;

(async () => {
  try {
    await client.connect();
    const database = client.db(process.env.DB_NAME || "dacsan3mien");
    productCollection = database.collection("Product");
    userCollection = database.collection("User");
    orderCollection = database.collection("Order");
    feedbackCollection = database.collection("Feedback");
    cartCollection = database.collection("Cart");
    blogCollection = database.collection("Blog");
    productReviewCollection = database.collection("ProductReview");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
})();

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
}

function requireRoleAction(requiredRole, requiredActions) {
  return (req, res, next) => {
    if (!req.session.userId || req.session.role !== requiredRole) {
      return res.status(403).json({ message: "Forbidden: Invalid Role" });
    }

    const userAction = req.session.action || "just view";
    if (requiredActions.includes("edit all") || requiredActions.includes(userAction)) {
      return next();
    }

    if (userAction === "just view" && requiredActions.includes("view")) {
      return next();
    }

    return res.status(403).json({ message: "Forbidden: Insufficient Permissions" });
  };
}

app.get(
  "/products",
  async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const productDept = req.query.dept || "";
    const productType = req.query.type || "";
    
    // Build filter object
    let filter = {};
    if (productDept) {
      filter.product_dept = productDept;
    }
    if (productType) {
      filter.type = productType;
    }
    
    try {
      const products = await productCollection
        .find(filter)
        .skip(skip)
        .limit(limit)
        .toArray();
      const total = await productCollection.countDocuments(filter);
      res.status(200).json({
        products,
        total,
        page,
        pages: Math.ceil(total / limit),
      });
    } catch {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

app.get("/products/:id", async (req, res) => {
  try {
    const productId = new ObjectId(req.params.id);
    const product = await productCollection.findOne({ _id: productId });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post(
  "/products",
  requireRoleAction("admin", ["edit all", "sales ctrl", "account ctrl"]),
  async (req, res) => {
    const { product_name, product_detail, stocked_quantity, unit_price, discount, product_dept, type, rating, image_1, image_2, image_3, image_4, image_5 } = req.body;

    if (!product_name || !unit_price) {
      return res.status(400).json({ message: "Please provide all required fields." });
    }
    if (typeof unit_price !== "number" || unit_price < 0) {
      return res.status(400).json({ message: "unit_price must be a non-negative number." });
    }
    if (typeof stocked_quantity !== "number" || stocked_quantity < 0) {
      return res.status(400).json({ message: "stocked_quantity must be a non-negative number." });
    }
    if (discount !== undefined && (discount < 0 || discount > 1)) {
      return res.status(400).json({ message: "discount must be between 0 and 1." });
    }

    const images = [image_1, image_2, image_3, image_4, image_5].filter(img => img);
    for (const img of images) {
      if (typeof img !== "string" || !img.startsWith("data:image/")) {
        return res.status(400).json({ message: "Invalid image format. Must be Base64." });
      }
    }

    const newProduct = {
      product_name,
      product_detail: product_detail || "",
      stocked_quantity: stocked_quantity || 0,
      unit_price,
      discount: discount || 0,
      product_dept: product_dept || "",
      type: type || "food",
      rating: rating || 4,
      createdAt: new Date(),
      updatedAt: new Date(),
      image_1: image_1 || "",
      image_2: image_2 || "",
      image_3: image_3 || "",
      image_4: image_4 || "",
      image_5: image_5 || "",
    };

    try {
      const result = await productCollection.insertOne(newProduct);
      res.status(201).json({ message: "Product added successfully", productId: result.insertedId });
    } catch (error) {
      res.status(500).json({ message: "Failed to add product" });
    }
  }
);

app.patch(
  "/products/:id",
  requireRoleAction("admin", ["edit all", "sales ctrl", "account ctrl"]),
  async (req, res) => {
    const productId = new ObjectId(req.params.id);
    const { image_1, image_2, image_3, image_4, image_5, ...updateData } = req.body;

    const images = [image_1, image_2, image_3, image_4, image_5];
    for (const img of images) {
      if (img && (typeof img !== "string" || !img.startsWith("data:image/"))) {
        return res.status(400).json({ message: "Invalid image format. Must be Base64." });
      }
    }

    const updatedImages = {
      image_1: image_1 || '',
      image_2: image_2 || '',
      image_3: image_3 || '',
      image_4: image_4 || '',
      image_5: image_5 || '',
    };

    try {
      const updatePayload = { ...updateData, ...updatedImages, updatedAt: new Date() };

      const result = await productCollection.updateOne(
        { _id: productId },
        { $set: updatePayload }
      );

      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: "Product not found or no changes made" });
      }

      res.status(200).json({ message: "Product updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update product" });
    }
  }
);

app.delete(
  "/products/:id",
  requireRoleAction("admin", ["edit all", "sales ctrl", "account ctrl"]),
  async (req, res) => {
    const productId = new ObjectId(req.params.id);
    try {
      const result = await productCollection.deleteOne({ _id: productId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json({ message: "Product deleted successfully" });
    } catch {
      res.status(500).json({ message: "Failed to delete product" });
    }
  }
);

app.delete("/products", requireAdmin, async (req, res) => {
  const { productIds } = req.body;
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return res.status(400).json({ message: "No product IDs provided" });
  }
  const objectIds = productIds.map(id => new ObjectId(id));
  try {
    const result = await productCollection.deleteMany({ _id: { $in: objectIds } });
    res.status(200).json({ message: "Products deleted successfully", deletedCount: result.deletedCount });
  } catch {
    res.status(500).json({ message: "Failed to delete products" });
  }
});

app.patch("/products/:id/update-stock", async (req, res) => {
  try {
    const productId = new ObjectId(req.params.id);
    const { quantity } = req.body;
    const result = await productCollection.updateOne(
      { _id: productId },
      { $inc: { stocked_quantity: -quantity } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Product not found or stock not updated" });
    }
    res.status(200).json({ message: "Stock updated successfully" });
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== PRODUCT REVIEWS ==========
// GET /products/:id/reviews — list reviews for a product (paginated, sort newest first)
app.get("/products/:id/reviews", async (req, res) => {
  const productId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const sortOrder = req.query.sort === 'oldest' ? 1 : -1;
  const skip = (page - 1) * limit;
  try {
    if (!productReviewCollection) {
      return res.status(200).json({ reviews: [], total: 0, page, pages: 0, averageRating: 0, ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
    }
    const filter = { productId };
    const [reviews, total, agg] = await Promise.all([
      productReviewCollection.find(filter).sort({ createdAt: sortOrder }).skip(skip).limit(limit).toArray(),
      productReviewCollection.countDocuments(filter),
      productReviewCollection.aggregate([
        { $match: { productId } },
        { $group: { _id: null, avg: { $avg: "$rating" }, counts: { $push: "$rating" } } }
      ]).toArray()
    ]);
    const averageRating = agg[0] ? Math.round(agg[0].avg * 10) / 10 : 0;
    const counts = (agg[0] && agg[0].counts) ? agg[0].counts : [];
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    counts.forEach(r => {
      const k = Math.round(Number(r));
      if (k >= 1 && k <= 5) ratingCounts[k] = (ratingCounts[k] || 0) + 1;
    });
    res.status(200).json({
      reviews,
      total,
      page,
      pages: Math.ceil(total / limit),
      averageRating,
      ratingCounts
    });
  } catch (err) {
    console.error("Error fetching product reviews:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /products/:id/reviews — add a review (requires login); body: { rating, comment, images?: string[] } (images as base64 data URLs)
app.post("/products/:id/reviews", requireAuth, async (req, res) => {
  const productId = req.params.id;
  const { rating, comment, images } = req.body;
  if (rating == null || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "rating must be between 1 and 5." });
  }
  const commentStr = typeof comment === "string" ? comment.trim() : "";
  const imagesArr = Array.isArray(images) ? images.filter(img => typeof img === "string" && img.startsWith("data:image/")).slice(0, 5) : [];
  try {
    const product = await productCollection.findOne({ _id: new ObjectId(productId) });
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }
    const user = await userCollection.findOne({ _id: new ObjectId(req.session.userId) });
    const userName = user?.profileName || (user?.email ? user.email.split("@")[0] : "Khách");
    const userEmail = user?.email || "";
    const newReview = {
      productId,
      userId: req.session.userId.toString(),
      userName,
      userEmail,
      rating: Number(rating),
      comment: commentStr,
      images: imagesArr,
      createdAt: new Date(),
      verified: true
    };
    await productReviewCollection.insertOne(newReview);
    res.status(201).json({ message: "Review submitted successfully" });
  } catch (err) {
    console.error("Error submitting review:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/user/signup", async (req, res) => {
  const { profileName, email, password, gender, birthMonth, birthDay, birthYear, marketing, role = 'user' } = req.body;
  if (!profileName || !email || !password) {
    return res.status(400).json({ message: "Please provide all required fields." });
  }
  try {
    const existingUser = await userCollection.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      profileName,
      email,
      password: hashedPassword,
      gender,
      birthDate: { month: birthMonth, day: birthDay, year: birthYear },
      marketing: !!marketing,
      role,
      avatar: "",
      memberPoints: 0,
      memberTier: "Member"
    };
    const result = await userCollection.insertOne(newUser);
    res.status(201).json({ message: "User registered successfully", userId: result.insertedId });
  } catch {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/user/login", async (req, res) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Please provide both email and password." });
  }
  try {
    const user = await userCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    req.session.userId = user._id;
    req.session.isLoggedIn = true;
    req.session.role = user.role;
    req.session.action = user.action || "just view";
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    } else {
      req.session.cookie.expires = false;
    }
    res.status(200).json({
      userId: user._id.toString(),
      role: user.role,
      action: user.action || "just view",
      token: user._id.toString(),
      message: "Login successful"
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/user/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ message: "Could not log out. Try again later." });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: "Logout successful" });
  });
});

app.get("/user/profile", requireAuth, async (req, res) => {
  const user = await userCollection.findOne({ _id: new ObjectId(req.session.userId) });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.status(200).json({
    _id: user._id,
    email: user.email,
    profileName: user.profileName,
    gender: user.gender,
    birthDate: user.birthDate,
    phone: user.phone,
    address: user.address,
    marketing: user.marketing,
    role: user.role,
    action: user.action || "just view",
    avatar: user.avatar || "",
    memberPoints: user.memberPoints || 0,
    memberTier: user.memberTier || "Member"
  });
});

app.patch(
  "/user/update/:userId",
  requireRoleAction("admin", ["edit all", "account ctrl"]),
  async (req, res) => {
    const { userId } = req.params;
    const updateData = { ...req.body };

    delete updateData.email;
    delete updateData.password;
    delete updateData._id;

    try {
      const result = await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      );
      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: "User not found or no changes made" });
      }
      res.status(200).json({ message: "User updated successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to update user" });
    }
  }
);

// Allow authenticated users to update their own profile (e.g., avatar, profileName, phone, address, birthDate)
app.patch("/user/profile", requireAuth, async (req, res) => {
  try {
    const allowed = ["profileName", "phone", "address", "birthDate", "gender", "marketing", "avatar"];
    const updateData = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }

    if (updateData.avatar) {
      if (typeof updateData.avatar !== "string" || !updateData.avatar.startsWith("data:image/")) {
        return res.status(400).json({ message: "Invalid avatar format. Must be Base64 data URL." });
      }
      if (updateData.avatar.length > 2_000_000) { // ~2MB limit for safety
        return res.status(413).json({ message: "Avatar image too large." });
      }
    }

    const result = await userCollection.updateOne(
      { _id: new ObjectId(req.session.userId) },
      { $set: updateData }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "User not found or no changes made" });
    }
    const updatedUser = await userCollection.findOne({ _id: new ObjectId(req.session.userId) });
    res.status(200).json({
      message: "Profile updated",
      user: {
        _id: updatedUser?._id,
        email: updatedUser?.email,
        profileName: updatedUser?.profileName,
        gender: updatedUser?.gender,
        birthDate: updatedUser?.birthDate,
        phone: updatedUser?.phone,
        address: updatedUser?.address,
        marketing: updatedUser?.marketing,
        role: updatedUser?.role,
        avatar: updatedUser?.avatar || '',
        memberPoints: updatedUser?.memberPoints || 0,
        memberTier: updatedUser?.memberTier || 'Member'
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile" });
  }
});

app.delete(
  "/user/delete/:userId",
  requireRoleAction("admin", ["edit all", "account ctrl"]),
  async (req, res) => {
    const { userId } = req.params;

    try {
      const result = await userCollection.deleteOne({ _id: new ObjectId(userId) });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  }
);

app.get("/user/user-management", requireRoleAction("admin", ["edit all", "account ctrl", "view"]), async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query;

  const filter = search
    ? { profileName: { $regex: search, $options: "i" } }
    : {};

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await userCollection
      .find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await userCollection.countDocuments(filter);

    res.status(200).json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/cart", requireAuth, async (req, res) => {
  try {
    const cartItems = await cartCollection.aggregate([
      { $match: { userId: req.session.userId } },
      {
        $lookup: {
          from: "Product",
          localField: "productId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          productId: 1,
          quantity: 1,
          unit_price: 1,
          userId: 1,
          product_name: "$productDetails.product_name",
          image_1: "$productDetails.image_1",
          stocked_quantity: "$productDetails.stocked_quantity"
        }
      }
    ]).toArray();
    res.status(200).json(cartItems);
  } catch {
    res.status(500).json({ message: "Failed to retrieve cart items" });
  }
});

app.post("/cart/add", requireAuth, async (req, res) => {
  const { productId, quantity, unit_price } = req.body;
  try {
    const itemToAdd = {
      userId: req.session.userId,
      productId: new ObjectId(productId),
      quantity,
      unit_price,
    };
    const existingItem = await cartCollection.findOne({ userId: req.session.userId, productId: itemToAdd.productId });
    if (existingItem) {
      await cartCollection.updateOne(
        { userId: req.session.userId, productId: itemToAdd.productId },
        { $inc: { quantity } }
      );
    } else {
      await cartCollection.insertOne(itemToAdd);
    }
    res.status(200).json({ message: "Item added to cart" });
  } catch {
    res.status(500).json({ message: "Failed to add item to cart" });
  }
});

app.delete("/cart/remove/:productId", requireAuth, async (req, res) => {
  const { productId } = req.params;
  try {
    await cartCollection.deleteOne({ userId: req.session.userId, productId: new ObjectId(productId) });
    res.status(200).json({ message: "Item removed from cart" });
  } catch {
    res.status(500).json({ message: "Failed to remove item from cart" });
  }
});

app.post('/cart/removeOrderedItems', requireAuth, async (req, res) => {
  const { orderedItemIds } = req.body;

  if (!Array.isArray(orderedItemIds) || orderedItemIds.length === 0) {
    return res.status(400).json({ message: 'Invalid or missing orderedItemIds.' });
  }

  try {
    const objectIds = orderedItemIds.map(id => new ObjectId(id));
    await cartCollection.deleteMany({
      userId: req.session.userId,
      productId: { $in: objectIds }
    });

    res.status(200).json({ message: 'Ordered items removed from cart.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove ordered items.' });
  }
});

app.patch("/cart/update", requireAuth, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    await cartCollection.updateOne(
      { userId: req.session.userId, productId: new ObjectId(productId) },
      { $set: { quantity } }
    );
    res.status(200).json({ message: "Cart item quantity updated" });
  } catch {
    res.status(500).json({ message: "Failed to update cart item quantity" });
  }
});

app.post("/cart/saveSelectedItems", requireAuth, async (req, res) => {
  const { selectedItems } = req.body;
  if (!selectedItems || !Array.isArray(selectedItems)) {
    return res.status(400).json({ message: "Invalid selected items data" });
  }

  try {
    await cartCollection.updateMany(
      { userId: req.session.userId },
      { $set: { selectedItems } },
      { upsert: true }
    );
    res.status(200).json({ message: "Selected items saved successfully" });
  } catch {
    res.status(500).json({ message: "Failed to save selected items" });
  }
});

app.delete("/cart/clear", requireAuth, async (req, res) => {
  try {
    await cartCollection.deleteMany({ userId: req.session.userId });
    res.status(200).json({ message: "Cart cleared" });
  } catch {
    res.status(500).json({ message: "Failed to clear cart" });
  }
});

/** GET /orders/me - Đơn hàng của user đang đăng nhập (requireAuth) */
app.get("/orders/me", requireAuth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const filter = { userId: req.session.userId };
    const orders = await orderCollection
      .aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "Product",
            let: { itemIds: "$selectedItems._id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: [
                      "$_id",
                      { $map: { input: "$$itemIds", as: "id", in: { $toObjectId: { $ifNull: ["$$id", ""] } } } }
                    ]
                  }
                }
              }
            ],
            as: "products"
          }
        },
        {
          $addFields: {
            selectedItems: {
              $map: {
                input: "$selectedItems",
                as: "item",
                in: {
                  $let: {
                    vars: {
                      prod: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$products",
                              cond: { $eq: ["$$this._id", { $toObjectId: { $ifNull: ["$$item._id", ""] } }] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: {
                      $mergeObjects: [
                        "$$item",
                        {
                          product_name: { $ifNull: ["$$prod.product_name", "Sản phẩm"] },
                          image_1: "$$prod.image_1",
                          product_dept: { $ifNull: ["$$prod.product_dept", ""] }
                        }
                      ]
                    }
                  }
                }
              }
            }
          }
        },
        { $project: { products: 0 } }
      ])
      .toArray();

    const total = await orderCollection.countDocuments(filter);
    res.status(200).json({
      orders,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error("orders/me error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get(
  "/orders",
  requireRoleAction("admin", ["edit all", "sales ctrl", "view"]),
  async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || "";

    const filter = {};
    if (search) {
      try {
        filter.$or = [
          { userName: { $regex: search, $options: "i" } },
          { _id: new ObjectId(search) },
        ];
      } catch (err) {
        console.error("Invalid ObjectId for search:", search);
      }
    }
    if (status) {
      filter.status = status;
    }

    try {
      const orders = await orderCollection
        .aggregate([
          { $match: filter },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "User",
              localField: "userId",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          {
            $addFields: {
              userName: {
                $ifNull: [
                  { $arrayElemAt: ["$userDetails.profileName", 0] },
                  { $concat: ["$shippingAddress.firstName", " ", "$shippingAddress.lastName"] },
                ],
              },
            },
          },
          {
            $project: {
              userDetails: 0,
            },
          },
        ])
        .toArray();

      const total = await orderCollection.countDocuments(filter);
      res.status(200).json({
        orders,
        total: await orderCollection.countDocuments(filter),
        page,
        pages: Math.ceil(await orderCollection.countDocuments(filter) / limit),
      });
    } catch (err) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

app.post("/orders", requireAuth, async (req, res) => {
  const userId = req.session?.userId || null;
  const { selectedItems, totalPrice, paymentMethod, shippingAddress } = req.body;

  if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
    return res.status(400).json({ message: "selectedItems must be a non-empty array." });
  }
  for (const item of selectedItems) {
    if (
      !item._id ||
      typeof item.quantity !== "number" ||
      item.quantity <= 0 ||
      typeof item.unit_price !== "number" ||
      item.unit_price < 0
    ) {
      return res.status(400).json({ message: "Invalid selectedItems format." });
    }
  }
  if (!totalPrice || typeof totalPrice !== "number" || totalPrice <= 0) {
    return res.status(400).json({ message: "Invalid totalPrice." });
  }
  if (!paymentMethod || typeof paymentMethod !== "string") {
    return res.status(400).json({ message: "Invalid paymentMethod." });
  }
  if (
    !shippingAddress ||
    !shippingAddress.firstName ||
    !shippingAddress.lastName ||
    !shippingAddress.address ||
    typeof shippingAddress.firstName !== "string" ||
    typeof shippingAddress.lastName !== "string" ||
    typeof shippingAddress.address !== "string"
  ) {
    return res.status(400).json({ message: "Invalid shippingAddress." });
  }

  try {
    const orderData = {
      userId,
      selectedItems,
      totalPrice,
      paymentMethod,
      shippingAddress,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "in_progress",
    };

    const result = await orderCollection.insertOne(orderData);

    for (const item of selectedItems) {
      const productId = new ObjectId(item._id);

      const product = await productCollection.findOne({ _id: productId });
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item._id}` });
      }

      if (product.stocked_quantity < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product ID: ${item._id}`,
        });
      }

      await productCollection.updateOne(
        { _id: productId },
        { $inc: { stocked_quantity: -item.quantity } }
      );
    }

    res
      .status(201)
      .json({ message: "Order placed successfully", orderId: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: "Failed to place order" });
  }
});

app.patch(
  "/orders/:id/status",
  requireRoleAction("admin", ["edit all", "sales ctrl"]),
  async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Missing status field" });
    }

    try {
      const result = await orderCollection.updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { status, updatedAt: new Date() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.status(200).json({ message: "Order status updated successfully" });
    } catch {
      res.status(500).json({ message: "Failed to update order status" });
    }
  }
);

app.delete(
  "/orders/:orderId",
  requireRoleAction("admin", ["edit all", "sales ctrl"]),
  async (req, res) => {
    const { orderId } = req.params;

    if (!ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    try {
      const result = await orderCollection.deleteOne({ _id: new ObjectId(orderId) });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.status(200).json({ message: "Order canceled successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to cancel the order" });
    }
  }
);

app.get('/orders/:orderId/invoice', requireAuth, async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await orderCollection.findOne({ _id: new ObjectId(orderId) });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const productIds = order.selectedItems.map(item => new ObjectId(item._id));
    const products = await productCollection.find({ _id: { $in: productIds } }).toArray();

    const itemsWithNames = order.selectedItems.map(item => {
      const product = products.find(p => p._id.toString() === item._id);
      return {
        ...item,
        name: product?.product_name || 'Unknown',
      };
    });

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const fileName = `invoice-${orderId}.pdf`;
    const filePath = `./invoices/${fileName}`;

    if (!fs.existsSync('./invoices')) {
      fs.mkdirSync('./invoices');
    }
    
    // Clear any cached logo
    console.log('Generating PDF for order:', orderId);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const fontPath = './fonts/Roboto-Regular.ttf';
    if (fs.existsSync(fontPath)) {
      doc.font(fontPath);
    }

    // Try multiple logo paths with absolute path
    const logoPaths = [
      './Logo.png', 
      './logo.png', 
      './Logo.PNG', 
      './logo.PNG',
      __dirname + '/Logo.png',
      __dirname + '/logo.png'
    ];
    let logoFound = false;
    
    for (const logoPath of logoPaths) {
      if (fs.existsSync(logoPath)) {
        console.log('Using logo:', logoPath);
        try {
          doc.image(logoPath, 50, 30, { width: 100 });
          logoFound = true;
          break;
        } catch (error) {
          console.log('Error loading logo:', error.message);
        }
      }
    }
    
    if (!logoFound) {
      console.log('No logo file found. Tried paths:', logoPaths);
      // Add a placeholder text if no logo found
      doc.fontSize(16).text('LOGO', 50, 30);
    }

    doc.fontSize(20).text('Hóa đơn bán hàng', 150, 50, { align: 'center' });
    doc.moveDown();

    doc.fontSize(12)
      .text(`Mã đơn hàng: ${orderId}`)
      .text(`Ngày tạo: ${new Date(order.createdAt).toLocaleDateString()}`)
      .text(`Khách hàng: ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`)
      .text(`Email: ${order.shippingAddress.email}`)
      .text(`Số điện thoại: ${order.shippingAddress.phone}`)
      .text(`Địa chỉ: ${order.shippingAddress.address}`);
    doc.moveDown();

    doc.fontSize(14).text('Chi tiết đơn hàng:');
    doc.moveDown();

    const columnWidths = [50, 200, 70, 100, 100];
    const tableStartX = 50;
    const tableStartY = doc.y;

    const drawTableBorders = (yStart, rowCount) => {
      const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      doc.lineWidth(0.5);

      for (let i = 0; i <= rowCount; i++) {
        const y = yStart + i * 20;
        doc.moveTo(tableStartX, y).lineTo(tableStartX + tableWidth, y).stroke();
      }

      let currentX = tableStartX;
      columnWidths.forEach(width => {
        doc.moveTo(currentX, yStart).lineTo(currentX, yStart + rowCount * 20).stroke();
        currentX += width;
      });
      doc.moveTo(currentX, yStart).lineTo(currentX, yStart + rowCount * 20).stroke();
    };

    const header = ['STT', 'Tên sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền'];
    const headerY = doc.y;

    header.forEach((text, i) => {
      doc.text(text, tableStartX + columnWidths.slice(0, i).reduce((sum, w) => sum + w, 0), headerY, {
        width: columnWidths[i],
        align: i === 0 ? 'left' : 'center',
      });
    });

    doc.moveDown(0.5);

    const rowStartY = doc.y;

    itemsWithNames.forEach((item, index) => {
      const rowY = rowStartY + index * 20;
      const row = [
        index + 1,
        item.name,
        item.quantity,
        `${item.unit_price.toLocaleString()} VND`,
        `${(item.quantity * item.unit_price).toLocaleString()} VND`,
      ];

      row.forEach((text, i) => {
        doc.text(text, tableStartX + columnWidths.slice(0, i).reduce((sum, w) => sum + w, 0), rowY, {
          width: columnWidths[i],
          align: i === 0 ? 'left' : 'center',
        });
      });
    });

    const totalRows = itemsWithNames.length + 1;
    drawTableBorders(tableStartY, totalRows);

    doc.moveDown(2);
    doc.fontSize(12)
      .text(`Tổng giá trị: ${order.totalPrice.toLocaleString()} VND`, 50, doc.y, { align: 'right' })
      .moveDown(0.5)
      .text(`Phương thức thanh toán: ${order.paymentMethod}`, 50, doc.y, { align: 'right' });

    doc.moveDown(2);
    doc.fontSize(12)
      .text('Cảm ơn bạn đã mua hàng!', 50, doc.y, { align: 'center' })
      .moveDown(0.5)
      .text('Liên hệ với chúng tôi: 079 2098 518', 50, doc.y, { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      res.download(filePath, fileName, (err) => {
        if (err) {
          res.status(500).json({ message: 'Failed to download PDF' });
        }
        fs.unlink(filePath, () => { });
      });
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post("/feedback", async (req, res) => {
  const { fullName, email, phone, message } = req.body;
  if (!fullName || !message) {
    return res.status(400).json({ message: "Full name and message are required." });
  }
  try {
    const feedbackData = {
      fullName,
      email: email || null,
      phone: phone || null,
      message,
      status: 'new',
      submittedAt: new Date(),
    };
    const result = await feedbackCollection.insertOne(feedbackData);
    res.status(201).json({ message: "Feedback submitted successfully", feedbackId: result.insertedId });
  } catch {
    res.status(500).json({ message: "Failed to submit feedback" });
  }
});

// Get all feedback/contacts for admin
app.get("/feedback", requireRoleAction("admin", ["edit all", "sales ctrl", "view"]), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || "";
  const status = req.query.status || "";

  try {
    const filter = {};
    
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }

    const feedback = await feedbackCollection
      .find(filter)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await feedbackCollection.countDocuments(filter);
    
    res.status(200).json({
      feedback,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update feedback status
app.patch("/feedback/:id/status", requireRoleAction("admin", ["edit all", "sales ctrl"]), async (req, res) => {
  const feedbackId = new ObjectId(req.params.id);
  const { status } = req.body;

  if (!status || !['new', 'read', 'replied'].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const result = await feedbackCollection.updateOne(
      { _id: feedbackId },
      { $set: { status, updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.status(200).json({ message: "Status updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
});

// Delete feedback
app.delete("/feedback/:id", requireRoleAction("admin", ["edit all", "sales ctrl"]), async (req, res) => {
  const feedbackId = new ObjectId(req.params.id);
  
  try {
    const result = await feedbackCollection.deleteOne({ _id: feedbackId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Feedback not found" });
    }
    res.status(200).json({ message: "Feedback deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete feedback" });
  }
});

// ========== DASHBOARD ENDPOINTS ==========

// Get dashboard statistics
app.get("/dashboard/stats", requireRoleAction("admin", ["edit all", "sales ctrl", "view"]), async (req, res) => {
  try {
    const totalProducts = await productCollection.countDocuments();
    const totalOrders = await orderCollection.countDocuments();
    const totalUsers = await userCollection.countDocuments();
    const totalBlogs = await blogCollection.countDocuments();
    const totalContacts = await feedbackCollection.countDocuments();
    const newContacts = await feedbackCollection.countDocuments({ status: 'new' });
    
    // Order statistics
    const pendingOrders = await orderCollection.countDocuments({ status: 'in_progress' });
    const completedOrders = await orderCollection.countDocuments({ status: 'completed' });
    const cancelledOrders = await orderCollection.countDocuments({ status: 'cancelled' });
    
    // Calculate total revenue
    const revenueResult = await orderCollection.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]).toArray();
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
    // Calculate average order value
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;
    
    // Recent orders
    const recentOrders = await orderCollection.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    // Low stock products
    const lowStockProducts = await productCollection.find({ stocked_quantity: { $lte: 10 } })
      .sort({ stocked_quantity: 1 })
      .limit(5)
      .toArray();
    
    // Top selling products (from orders)
    const topProducts = await orderCollection.aggregate([
      { $unwind: '$selectedItems' },
      { $group: {
        _id: '$selectedItems._id',
        productName: { $first: '$selectedItems.product_name' },
        totalQuantity: { $sum: '$selectedItems.quantity' },
        totalRevenue: { $sum: { $multiply: ['$selectedItems.quantity', '$selectedItems.unit_price'] } }
      }},
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]).toArray();
    
    // Generate fake sales data for charts (not connected to real database)
    const generateFakeSalesData = () => {
      const salesData = [];
      const weeklySalesData = [];
      const monthlySalesData = [];
      
      // Generate 30 days of fake sales data
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dailyRevenue = Math.floor(Math.random() * 5000000) + 1000000; // 1M - 6M VND
        const dailyOrders = Math.floor(Math.random() * 20) + 5; // 5-25 orders
        
        salesData.push({
          _id: date.toISOString().split('T')[0],
          dailyRevenue: dailyRevenue,
          dailyOrders: dailyOrders
        });
      }
      
      // Generate 7 days of fake weekly data
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dailyRevenue = Math.floor(Math.random() * 3000000) + 500000; // 500K - 3.5M VND
        
        weeklySalesData.push({
          _id: date.toISOString().split('T')[0],
          dailyRevenue: dailyRevenue,
          dailyOrders: Math.floor(Math.random() * 15) + 3
        });
      }
      
      // Generate 12 months of fake monthly data
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthlyRevenue = Math.floor(Math.random() * 50000000) + 10000000; // 10M - 60M VND
        const monthlyOrders = Math.floor(Math.random() * 200) + 50; // 50-250 orders
        
        monthlySalesData.push({
          _id: date.toISOString().substring(0, 7), // YYYY-MM format
          monthlyRevenue: monthlyRevenue,
          monthlyOrders: monthlyOrders
        });
      }
      
      return { salesData, weeklySalesData, monthlySalesData };
    };
    
    const { salesData, weeklySalesData, monthlySalesData } = generateFakeSalesData();
    
    // Calculate growth rates (fake data)
    const revenueGrowth = Math.floor(Math.random() * 40) - 10; // -10% to +30%
    const ordersGrowth = Math.floor(Math.random() * 30) - 5; // -5% to +25%
    
    res.status(200).json({
      overview: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalBlogs,
        totalContacts,
        newContacts,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue,
        avgOrderValue,
        revenueGrowth,
        ordersGrowth
      },
      recentOrders,
      lowStockProducts,
      topProducts,
      salesData,
      weeklySalesData,
      monthlySalesData
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/dashboard/activities", requireRoleAction("admin", ["edit all", "sales ctrl", "account ctrl", "view"]), async (req, res) => {
  try {
    const [
      latestProducts,
      latestBlogs,
      latestOrders,
      latestFeedback
    ] = await Promise.all([
      productCollection
        ? productCollection
            .find({}, { projection: { product_name: 1, updatedAt: 1, createdAt: 1 } })
            .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
            .limit(5)
            .toArray()
        : [],
      blogCollection
        ? blogCollection
            .find({}, { projection: { title: 1, updatedAt: 1, createdAt: 1, published: 1 } })
            .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
            .limit(5)
            .toArray()
        : [],
      orderCollection
        ? orderCollection
            .find({}, { projection: { status: 1, totalPrice: 1, updatedAt: 1, createdAt: 1 } })
            .sort({ updatedAt: -1, createdAt: -1, _id: -1 })
            .limit(5)
            .toArray()
        : [],
      feedbackCollection
        ? feedbackCollection
            .find({}, { projection: { fullName: 1, status: 1, message: 1, updatedAt: 1, submittedAt: 1 } })
            .sort({ updatedAt: -1, submittedAt: -1, _id: -1 })
            .limit(5)
            .toArray()
        : []
    ]);

    const resolveTimestamp = (doc, extraFields = []) => {
      const candidates = [
        ...extraFields,
        'updatedAt',
        'createdAt',
        'submittedAt'
      ];
      for (const field of candidates) {
        if (doc && doc[field]) {
          const value = doc[field];
          if (value instanceof Date) {
            return value;
          }
          const parsed = new Date(value);
          if (!Number.isNaN(parsed.getTime())) {
            return parsed;
          }
        }
      }
      if (doc && doc._id && typeof doc._id.getTimestamp === 'function') {
        return doc._id.getTimestamp();
      }
      return new Date();
    };

    const formatCurrency = (amount) => {
      if (typeof amount !== 'number') {
        return '';
      }
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
      }).format(amount);
    };

    const orderStatusLabels = {
      in_progress: 'Đang xử lý',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };

    const activities = [
      ...latestProducts.map(product => ({
        category: 'Chức năng',
        item: 'Sản phẩm',
        name: product?.product_name || `ID: ${product?._id?.toString() ?? ''}`,
        action: 'edit',
        timestamp: resolveTimestamp(product),
        meta: {
          type: 'product',
          id: product?._id?.toString() ?? null
        }
      })),
      ...latestBlogs.map(blog => ({
        category: 'Chức năng',
        item: blog?.published === false ? 'Blog (nháp)' : 'Blog',
        name: blog?.title || `ID: ${blog?._id?.toString() ?? ''}`,
        action: 'edit',
        timestamp: resolveTimestamp(blog),
        meta: {
          type: 'blog',
          id: blog?._id?.toString() ?? null
        }
      })),
      ...latestOrders.map(order => ({
        category: 'Đơn hàng',
        item: `#${order?._id?.toString().slice(-8) ?? ''}`,
        name: `${orderStatusLabels[order?.status] || 'Đơn hàng'}${order?.totalPrice ? ` • ${formatCurrency(order.totalPrice)}` : ''}`,
        action: 'view',
        timestamp: resolveTimestamp(order),
        meta: {
          type: 'order',
          id: order?._id?.toString() ?? null,
          status: order?.status ?? null
        }
      })),
      ...latestFeedback.map(feedback => ({
        category: 'Liên hệ',
        item: feedback?.status === 'new' ? 'Liên hệ mới' : 'Liên hệ',
        name: feedback?.fullName || 'Khách hàng ẩn danh',
        action: 'view',
        timestamp: resolveTimestamp(feedback, ['submittedAt']),
        meta: {
          type: 'feedback',
          id: feedback?._id?.toString() ?? null,
          status: feedback?.status ?? null
        }
      }))
    ]
      .filter(activity => activity.name && activity.timestamp)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 12)
      .map(activity => ({
        ...activity,
        timestamp: activity.timestamp instanceof Date ? activity.timestamp.toISOString() : activity.timestamp
      }));

    res.status(200).json({ activities });
  } catch (err) {
    console.error("Error fetching recent dashboard activities:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ========== BLOG ENDPOINTS ==========

// Get all blogs (public) with pagination
app.get("/blogs", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const filter = { published: true };
    const blogs = await blogCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    const total = await blogCollection.countDocuments(filter);
    
    res.status(200).json({
      blogs,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get all blogs for admin (with search)
app.get("/blogs/admin/list", requireRoleAction("admin", ["edit all", "sales ctrl", "view"]), async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || "";

  try {
    if (!blogCollection) {
      console.error("Blog collection not initialized");
      return res.status(500).json({ message: "Database not initialized" });
    }

    const filter = search
      ? { title: { $regex: search, $options: "i" } }
      : {};

    const blogs = await blogCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    const total = await blogCollection.countDocuments(filter);
    
    res.status(200).json({
      blogs,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Error fetching blogs for admin:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get single blog by ID (public)
app.get("/blogs/:id", async (req, res) => {
  try {
    const blogId = new ObjectId(req.params.id);
    const blog = await blogCollection.findOne({ _id: blogId });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json(blog);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Create new blog (admin only)
app.post("/blogs", requireRoleAction("admin", ["edit all", "sales ctrl"]), async (req, res) => {
  const { title, description, content, image, author, published } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required." });
  }

  if (image && (typeof image !== "string" || !image.startsWith("data:image/"))) {
    return res.status(400).json({ message: "Invalid image format. Must be Base64." });
  }

  const newBlog = {
    title,
    description: description || "",
    content,
    image: image || "",
    author: author || "Admin",
    published: published !== undefined ? published : true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const result = await blogCollection.insertOne(newBlog);
    res.status(201).json({ message: "Blog created successfully", blogId: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: "Failed to create blog" });
  }
});

// Update blog (admin only)
app.patch("/blogs/:id", requireRoleAction("admin", ["edit all", "sales ctrl"]), async (req, res) => {
  const blogId = new ObjectId(req.params.id);
  const { image, ...updateData } = req.body;

  if (image && (typeof image !== "string" || !image.startsWith("data:image/"))) {
    return res.status(400).json({ message: "Invalid image format. Must be Base64." });
  }

  try {
    const updatePayload = {
      ...updateData,
      ...(image && { image }),
      updatedAt: new Date(),
    };

    const result = await blogCollection.updateOne(
      { _id: blogId },
      { $set: updatePayload }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Blog not found or no changes made" });
    }

    res.status(200).json({ message: "Blog updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update blog" });
  }
});

// Delete blog (admin only)
app.delete("/blogs/:id", requireRoleAction("admin", ["edit all", "sales ctrl"]), async (req, res) => {
  const blogId = new ObjectId(req.params.id);
  
  try {
    const result = await blogCollection.deleteOne({ _id: blogId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete blog" });
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
