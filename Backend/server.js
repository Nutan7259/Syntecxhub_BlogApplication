require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const OpenAI = require("openai");
const cors = require("cors");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_do_not_use_in_prod";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

const app = express();

/* ================= CORS ================= */
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://syntecxhub-blog-application.vercel.app",
  "https://syntecxhub-blog-application-5o67.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("🚀 Life Story Blog Backend Running");
});

/* ================= DB ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    /* ================= SERVER ================= */
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err.message);
  });

/* ================= SCHEMAS ================= */
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});
const User = mongoose.model("User", userSchema);

const blogSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    thoughts: String,
    image: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    views: { type: Number, default: 0 },
    tags: [String],
    category: String,
  },
  { timestamps: true }
);
const Blog = mongoose.model("Blog", blogSchema);

/* ================= AUTH MIDDLEWARE ================= */
const authMiddleware = (req, res, next) => {
  console.log("AUTH HEADER:", req.headers.authorization);
  console.log("JWT_SECRET EXISTS:", !!process.env.JWT_SECRET);

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.log("JWT VERIFY ERROR:", err.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* ================= UPLOAD ================= */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

/* ================= AUTH ROUTES ================= */
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hash });

    res.json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch {
    res.status(500).json({ message: "Login failed" });
  }
});

/* ================= BLOG ================= */
app.post("/api/blogs", authMiddleware, upload.single("image"), async (req, res) => {
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
});

app.get("/api/blogs", async (_, res) => {
  const blogs = await Blog.find().populate("author", "name");
  res.json(blogs);
});

/* ================= BLOG ROUTES ================= */

// Updated to ensure we get the ID for the owner check
app.get("/api/blogs/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author", "name _id");
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: "Error fetching blog" });
  }
});

// Update Blog with Owner Check
app.put("/api/blogs/:id", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to edit this blog" });
    }
    
    const updatedData = { ...req.body };
    if (req.file) updatedData.image = req.file.filename;

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.json(updatedBlog);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

// Delete Blog with Owner Check
app.delete("/api/blogs/:id", authMiddleware, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (blog.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to delete this blog" });
    }

    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Blog deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});