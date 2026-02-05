import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const CreateBlog = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thoughts, setThoughts] = useState("");
  const [image, setImage] = useState(null);

  // Define dynamic API Base URL
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const API_BASE = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;

const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("thoughts", thoughts);
      if (image) formData.append("image", image);

      // FIXED: Added "Bearer " prefix required by your server.js middleware
      await axios.post(`${API_BASE}/api/blogs`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "multipart/form-data" 
        },
      });

      navigate("/blogs");
    } catch (err) {
      console.log(err.response?.data || err.message);
      alert(err.response?.data?.message || "Error creating blog");
    }
  };


  return (
    <div className="form-container">
      <h2>Create Blog</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <ReactQuill theme="snow" value={description} onChange={setDescription} placeholder="Write blog description..." />
        <textarea placeholder="Your thoughts..." value={thoughts} onChange={(e) => setThoughts(e.target.value)} />
        <input type="file" onChange={(e) => setImage(e.target.files[0])} />
        <button type="submit">Post Blog</button>
      </form>
    </div>
  );
};

export default CreateBlog;