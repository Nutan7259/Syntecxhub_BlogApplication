import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="home-hero">
      <div className="home-overlay">
        <span className="home-badge">LIFE STORIES</span>

        <h1>Life Story Blog</h1>

        <p>
          Read inspiring life stories shared by users and great personalities
          from around the world.
        </p>

        <Link to="/blogs" className="home-btn">
          Explore Blogs
        </Link>
      </div>
    </div>
  );
};

export default Home;
