import { Link } from "react-router-dom";

const BlogCard = ({ blog }) => (
  <div className="blog-card">
  <img
    src={`http://localhost:5000/uploads/${blog.image}`}
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

    <button className="read-btn">Read This Blog</button>
  </div>
</div>

);

export default BlogCard;
