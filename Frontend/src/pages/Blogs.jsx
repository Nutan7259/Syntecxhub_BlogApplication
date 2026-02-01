import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../App.css";

// helper to remove HTML tags
const stripHtml = (html) => html.replace(/<[^>]*>?/gm, "");

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/blogs");
        setBlogs(res.data);
      } catch (err) {
        console.log(err.response?.data || err.message);
      }
    };
    fetchBlogs();
  }, []);

  return (
    <div className="blogs-container">
      <h1>Life Story Blogs</h1>

      <div className="blogs-grid">
        {blogs.map((blog) => (
          <div key={blog._id} className="blog-card">
            {blog.image && (
              <img
                src={`http://localhost:5000/uploads/${blog.image}`}
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
