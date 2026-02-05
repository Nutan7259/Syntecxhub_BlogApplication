import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const BlogDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [blog, setBlog] = useState(null);

  // Define dynamic API Base URL
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const API_BASE = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/blogs/${id}`)
      .then(res => setBlog(res.data))
      .catch(err => console.log(err));
  }, [id, API_BASE]); // Added API_BASE to dependency array

  const handleDelete = async () => {
    if (!window.confirm("Delete this blog?")) return;

    try {
      await axios.delete(`${API_BASE}/api/blogs/${id}`, {
        headers: { Authorization: token },
      });
      navigate("/blogs");
    } catch (err) {
      alert("Not allowed");
    }
  };

  if (!blog) return <p className="loading">Loading...</p>;

  const isOwner = user && blog.author._id === user._id;

  return (
    <div className="blog-details">
      <h1>{blog.title}</h1>

      <p className="blog-details-meta">
        By <strong>{blog.author.name}</strong> •{" "}
        {new Date(blog.createdAt).toDateString()}
      </p>

      {blog.image && (
        <img
          src={`${API_BASE}/uploads/${blog.image}`}
          alt={blog.title}
        />
      )}

      <div
        className="blog-full-content"
        dangerouslySetInnerHTML={{ __html: blog.description }}
      />

      {blog.thoughts && (
        <div className="blog-thoughts">
          <strong>Thoughts:</strong> {blog.thoughts}
        </div>
      )}

      {/* 👇 OWNER ONLY */}
      {isOwner && (
        <div style={{ marginTop: "20px" }}>
          <button onClick={() => navigate(`/edit/${blog._id}`)}>
            ✏ Edit
          </button>
          <button
            onClick={handleDelete}
            style={{ marginLeft: "10px", background: "crimson", color: "#fff" }}
          >
            🗑 Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default BlogDetails;