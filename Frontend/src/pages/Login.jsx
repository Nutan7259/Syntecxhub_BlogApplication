import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

/* ================= URL FIX ================= */
// This ensures that even if Vercel adds a "/" at the end, 
// your code won't create a double slash like //api/login
const RAW_URL = import.meta.env.VITE_API_URL;
const API_BASE = RAW_URL?.endsWith("/") ? RAW_URL.slice(0, -1) : RAW_URL;

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false); // Added loading state
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!API_BASE) {
      alert("API URL not found. Please check Vercel Environment Variables.");
      return;
    }

    setLoading(true);
    try {
      // API_BASE is now sanitized (e.g., https://site.onrender.com)
      const res = await axios.post(`${API_BASE}/api/login`, form);
      
      login(res.data.user, res.data.token);
      navigate("/blogs");
    } catch (err) {
      console.error("LOGIN ERROR:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Login failed. Server may be sleeping.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input 
          name="email" 
          type="email" 
          placeholder="Email" 
          onChange={handleChange} 
          required 
          disabled={loading}
        />
        <input 
          name="password" 
          type="password" 
          placeholder="Password" 
          onChange={handleChange} 
          required 
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;