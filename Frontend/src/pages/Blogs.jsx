import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../App.css";

// helper to remove HTML tags
const stripHtml = (html) => html.replace(/<[^>]*>?/gm, "");

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);

  // Define dynamic API Base URL
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const API_BASE = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        // Use the API_BASE variable here
        const res = await axios.get(`${API_BASE}/api/blogs`);
        setBlogs(res.data);
      } catch (err) {
        console.log(err.response?.data || err.message);
      }
    };
    fetchBlogs();
  }, [API_BASE]); // Added API_BASE as a dependency

  return (
    <div className="blogs-container">
      <h1>Life Story Blogs</h1>

      <div className="blogs-grid">
        {blogs.map((blog) => (
          <div key={blog._id} className="blog-card">
            {blog.image && (
              <img
                // Updated image source to use API_BASE
                src={`${API_BASE}/uploads/${blog.image}`}
                alt={blog.title}
              />
            )}

            <h3>{blog.title}</h3>

            <p className="blog-desc">
              {stripHtml(blog.description).slice(0, 120)}...
            </p>

            <div className="blog-meta">
              <span>✍ {blog.author?.name || "Unknown"}</span>
              <span>
                📅 {new Date(blog.createdAt).toLocaleDateString()}
              </span>
            </div>

            <Link to={`/blogs/${blog._id}`} className="read-btn">
              Read Full Blog
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Blogs;