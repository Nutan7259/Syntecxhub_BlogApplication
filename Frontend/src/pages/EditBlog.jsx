import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { AuthContext } from "../context/AuthContext";

const EditBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thoughts, setThoughts] = useState("");
  const [image, setImage] = useState(null);

  // 🔹 Define dynamic API Base URL
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const API_BASE = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

  // 🔹 Load existing blog
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/blogs/${id}`);
        setTitle(res.data.title);
        setDescription(res.data.description);
        setThoughts(res.data.thoughts || "");
      } catch (err) {
        console.error("Error fetching blog:", err);
      }
    };
    fetchBlog();
  }, [id, API_BASE]);

  // 🔹 Update blog
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("thoughts", thoughts);
    if (image) formData.append("image", image);

    try {
      await axios.put(`${API_BASE}/api/blogs/${id}`, formData, {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data",
        },
      });
      navigate(`/blogs/${id}`);
    } catch (err) {
      console.error("Error updating blog:", err);
      alert("Failed to update blog.");
    }
  };

  return (
    <div className="blog-details">
      <h1>Edit Blog</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Blog Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <ReactQuill
          theme="snow"
          value={description}
          onChange={setDescription}
          placeholder="Write your story here..."
        />
        <textarea
          placeholder="Your thoughts"
          value={thoughts}
          onChange={(e) => setThoughts(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />
        <button type="submit">Update Blog</button>
      </form>
    </div>
  );
};

export default EditBlog;