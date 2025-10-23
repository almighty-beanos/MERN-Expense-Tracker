import React, { useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleHeaderClick = (e) => {
    e.preventDefault();

    if (user) {
      navigate("/dashboard");
    } else if (location.pathname === "/login" || location.pathname === "/register") {
      navigate(location.pathname); // Reload same page
    } else {
      navigate("/"); // Redirect to home if logged out
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <a href="/" className="navbar-brand" onClick={handleHeaderClick}>
          Expense Tracker
        </a>
        <div>
          {user ? (
            <>
              <Link className="btn btn-light me-2" to="/income">Income</Link>
              <Link className="btn btn-light me-2" to="/expenses">Expenses</Link>
              <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link className="btn btn-light me-2" to="/">Login</Link>
              <Link className="btn btn-light" to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
