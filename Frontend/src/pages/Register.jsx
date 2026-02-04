import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// ✅ MUST be set in Vercel
const API_URL = import.meta.env.VITE_API_URL;

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!API_URL) {
      alert("API URL not configured");
      return;
    }

    if (!form.name || !form.email || !form.password) {
      alert("All fields are required");
      return;
    }

    try {
      // REGISTER
      await axios.post(
        `${API_URL}/api/register`,
        form,
        { headers: { "Content-Type": "application/json" } }
      );

      // LOGIN
      const res = await axios.post(
        `${API_URL}/api/login`,
        {
          email: form.email,
          password: form.password,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      login(res.data.user, res.data.token);
      navigate("/blogs");
    } catch (err) {
      console.error("Register error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Error registering user");
    }
  };

  return (
    <div className="form-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <label>Name:</label>
        <input name="name" onChange={handleChange} required />

        <label>Email:</label>
        <input name="email" type="email" onChange={handleChange} required />

        <label>Password:</label>
        <input name="password" type="password" onChange={handleChange} required />

        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
