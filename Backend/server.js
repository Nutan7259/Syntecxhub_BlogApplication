const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const app = express();

/* ================= CONFIG (NO .ENV) ================= */
const PORT = 5000;
const MONGO_URI = "mongodb://127.0.0.1:27017/lifeStoryBlog";
const JWT_SECRET = "lifeStorySecret123";

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= DB CONNECTION ================= */
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

/* ================= USER SCHEMA ================= */
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});

const User = mongoose.model("User", userSchema);

/* ================= BLOG SCHEMA ================= */
const blogSchema = new mongoose.Schema(
  {
    title: String,
    description: String, // rich text (HTML)
    thoughts: String,
    image: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);

/* ================= AUTH MIDDLEWARE ================= */
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

/* ================= IMAGE UPLOAD ================= */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* ================= AUTH ROUTES ================= */

// REGISTER
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashedPassword,
  });

  res.json({ message: "User registered successfully" });
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign(
  { id: user._id, email: user.email },
  JWT_SECRET
);


  res.json({ token, user });
});

/* ================= BLOG ROUTES ================= */

// CREATE BLOG
app.post(
  "/api/blogs",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    const blog = await Blog.create({
      title: req.body.title,
      description: req.body.description,
      thoughts: req.body.thoughts,
      image: req.file ? req.file.filename : null,
      author: req.user.id,
    });

    res.json(blog);
  }
);

// GET ALL BLOGS
app.get("/api/blogs", async (req, res) => {
  const blogs = await Blog.find().populate("author", "name");
  res.json(blogs);
});

// GET SINGLE BLOG
app.get("/api/blogs/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("author", "name");
  res.json(blog);
});

app.put(
  "/api/blogs/:id",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    const blog = await Blog.findById(req.params.id);

    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // ❌ Not the owner
    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    blog.title = req.body.title;
    blog.description = req.body.description;
    blog.thoughts = req.body.thoughts;
    if (req.file) blog.image = req.file.filename;

    await blog.save();
    res.json(blog);
  }
);


// DELETE BLOG
app.delete("/api/blogs/:id", authMiddleware, async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) return res.status(404).json({ message: "Blog not found" });

  // ❌ Not the owner
  if (blog.author.toString() !== req.user.id) {
    return res.status(403).json({ message: "Not allowed" });
  }

  await blog.deleteOne();
  res.json({ message: "Blog deleted successfully" });
});


/* ================= SERVER ================= */
app.get("/", (req, res) => {
  res.send("🚀 Life Story Blog Backend Running");
});

app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
