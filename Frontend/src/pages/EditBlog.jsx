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

  // 🔹 Load existing blog
  useEffect(() => {
    const fetchBlog = async () => {
      const res = await axios.get(`http://localhost:5000/api/blogs/${id}`);
      setTitle(res.data.title);
      setDescription(res.data.description);
      setThoughts(res.data.thoughts || "");
    };
    fetchBlog();
  }, [id]);

  // 🔹 Update blog
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("thoughts", thoughts);
    if (image) formData.append("image", image);

    await axios.put(`http://localhost:5000/api/blogs/${id}`, formData, {
      headers: {
        Authorization: token,
      },
    });

    navigate(`/blogs/${id}`);
  };

  return (
    <div className="blog-details">
      <h1>Edit Blog</h1>

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <input
          type="text"
          placeholder="Blog Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Description (React-Quill Toolbar FIXED) */}
        <ReactQuill
          theme="snow"
          value={description}
          onChange={setDescription}
          placeholder="Write your story here..."
        />

        {/* Thoughts */}
        <textarea
          placeholder="Your thoughts"
          value={thoughts}
          onChange={(e) => setThoughts(e.target.value)}
        />

        {/* Image */}
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
                                              