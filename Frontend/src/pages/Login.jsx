import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/login", form);
      login(res.data.user, res.data.token);
      navigate("/blogs");
    } catch (err) {
      console.log(err.response?.data || err.message);
      alert(err.response?.data?.message || "Error logging in");
    }
  };

  return (
    <div className="form-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <label>Email:</label>
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required /> <br></br> <br></br>
        <label>Password:</label>
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required /><br></br> <br></br>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
