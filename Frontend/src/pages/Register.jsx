import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Direct call to backend
      await axios.post("http://localhost:5000/api/register", form);

      // Login immediately
      const res = await axios.post("http://localhost:5000/api/login", {
        email: form.email,
        password: form.password,
      });

      login(res.data.user, res.data.token);
      navigate("/blogs");
    } catch (err) {
      console.log(err.response?.data || err.message);
      alert(err.response?.data?.message || "Error registering user");
    }
  };

  return (
    <div className="form-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <label>Name:</label><br></br>
        <input name="name" placeholder="Name" onChange={handleChange} required /><br></br><br></br>
        <label>Email:</label>
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required /><br></br><br></br>
        <label>Password:</label>
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required /><br></br><br></br>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
