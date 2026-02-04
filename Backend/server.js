require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const OpenAI = require("openai");

const app = express();

/* CONFIG */
const JWT_SECRET = process.env.JWT_SECRET;

/* OPENAI */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* MIDDLEWARE */
/* MIDDLEWARE */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://syntecxhub-blog-application.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));


/* DB CONNECTION */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

/* USER SCHEMA */
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Blog" }],
});
const User = mongoose.model("User", userSchema);

/* BLOG SCHEMA */
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

/* COMMENT SCHEMA */
const commentSchema = new mongoose.Schema(
  {
    text: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog" },
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", commentSchema);

/* AUTH MIDDLEWARE */
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

/* IMAGE UPLOAD */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

/* AUTH ROUTES */

// REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

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

// LOGIN
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

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
});

/* BLOG ROUTES */

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
    } catch (err) {
      res.status(500).json({ message: "Blog creation failed" });
    }
  }
);

// GET ALL BLOGS
app.get("/api/blogs", async (req, res) => {
  const blogs = await Blog.find().populate("author", "name");
  res.json(blogs);
});

// GET SINGLE BLOG + VIEW COUNT
app.get("/api/blogs/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("author", "name");

  blog.views += 1;
  await blog.save();

  res.json(blog);
});

// LIKE BLOG
app.post("/api/blogs/:id/like", authMiddleware, async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  if (blog.likes.includes(req.user.id)) {
    blog.likes.pull(req.user.id);
  } else {
    blog.likes.push(req.user.id);
  }

  await blog.save();
  res.json({ likes: blog.likes.length });
});

// BOOKMARK BLOG
app.post("/api/bookmark/:id", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user.bookmarks.includes(req.params.id)) {
    user.bookmarks.pull(req.params.id);
  } else {
    user.bookmarks.push(req.params.id);
  }

  await user.save();
  res.json(user.bookmarks);
});

// COMMENT BLOG
app.post("/api/comments/:id", authMiddleware, async (req, res) => {
  const comment = await Comment.create({
    text: req.body.text,
    author: req.user.id,
    blog: req.params.id,
  });

  res.json(comment);
});

app.get("/api/comments/:id", async (req, res) => {
  const comments = await Comment.find({ blog: req.params.id }).populate(
    "author",
    "name"
  );
  res.json(comments);
});

/* AI BLOG SUMMARY */
app.post("/api/blogs/:id/summary", async (req, res) => {
  const blog = await Blog.findById(req.params.id);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `Summarize this blog:\n${blog.description}`,
      },
    ],
  });

  res.json({ summary: response.choices[0].message.content });
});

/* SERVER */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
