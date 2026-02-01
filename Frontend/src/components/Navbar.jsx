import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
   <nav>
  <div>
    <Link to="/">Home</Link>
    <Link to="/blogs">Blogs</Link>
  </div>

  <div>
    {user ? (
      <>
        <Link to="/create-blog">Create Blog</Link>
        <button onClick={logout}>Logout</button>
      </>
    ) : (
      <>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </>
    )}
  </div>
</nav>

  );
};

export default Navbar;
