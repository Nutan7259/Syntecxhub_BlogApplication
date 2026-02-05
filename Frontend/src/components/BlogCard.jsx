import { Link } from "react-router-dom";

const BlogCard = ({ blog }) => {
  // Get the API URL from environment variables
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  
  // Clean the URL to ensure there is no double slash before 'uploads'
  const API_BASE = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

  return (
    <div className="blog-card">
      <img
        src={`${API_BASE}/uploads/${blog.image}`}
        alt={blog.title}
        className="blog-image"
      />

      <div className="blog-content">
        <h3>{blog.title}</h3>

        {/* Render HTML from React-Quill */}
        <div
          className="blog-description"
          dangerouslySetInnerHTML={{ __html: blog.description }}
        />

        <Link to={`/blog/${blog._id}`}>
          <button className="read-btn">Read This Blog</button>
        </Link>
      </div>
    </div>
  );
};

export default BlogCard;