require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const OpenAI = require("openai");

/* ================= CONFIG ================= */
const JWT_SECRET = process.env.JWT_SECRET;

/* ================= OPENAI (optional) ================= */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

/* ================= APP ================= */
const app = express();

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔥 BULLETPROOF CORS (local + production)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://syntecxhub-blog-application.vercel.app",
  "https://syntecxhub-blog-application-5o67.vercel.app",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // Preflight request handled
  }

  next();
});

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("🚀 Life Story Blog Backend Running");
});

/* ================= DB CONNECTION ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1);
  });

/* ================= SCHEMAS ================= */
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
});
const User = mongoose.model("User", userSchema);

const blogSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    thoughts: String,
    image: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    views: { type: Number, default: 0 },
    tags: [String],
    category: String,
  },
  { timestamps: true }
);
const Blog = mongoose.model("Blog", blogSchema);

const commentSchema = new mongoose.Schema(
  {
    text: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog" },
  },
  { timestamps: true }
);
const Comment = mongoose.model("Comment", commentSchema);

/* ================= AUTH MIDDLEWARE ================= */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];

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
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hash });

    res.json({ message: "Registered successfully" });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({
      message:
        err.code === 11000
          ? "Email already registered"
          : "Registration failed",
    });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

/* ================= BLOG ROUTES ================= */
// CREATE BLOG
app.post(
  "/api/blogs",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const blog = await Blog.create({
        ...req.body,
        image: req.file ? req.file.filename : null,
        author: req.user.id,
      });
      res.json(blog);
    } catch {
      res.status(500).json({ message: "Blog creation failed" });
    }
  }
);

// GET BLOGS
app.get("/api/blogs", async (req, res) => {
  const blogs = await Blog.find().populate("author", "name");
  res.json(blogs);
});

// GET SINGLE BLOG
app.get("/api/blogs/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("author", "name");
  if (!blog) return res.status(404).json({ message: "Blog not found" });

  blog.views += 1;
  await blog.save();
  res.json(blog);
});

/* ================= AI SUMMARY (OPTIONAL) ================= */
app.post("/api/blogs/:id/summary", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY)
      return res.status(400).json({ message: "AI not configured" });

    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: `Summarize this blog:\n${blog.description}` },
      ],
    });

    res.json({ summary: response.choices[0].message.content });
  } catch {
    res.status(500).json({ message: "AI summary failed" });
  }
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
