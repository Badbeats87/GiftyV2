import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // We'll create this CSS file next

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">Gifty</Link>
      <div className="navbar-links">
        <Link to="/businesses" className="nav-link">Businesses</Link>
        <Link to="/dashboard" className="nav-link">Dashboard</Link> {/* Add link to User Dashboard */}
        <Link to="/admin/login" className="nav-link">Admin Login</Link> {/* Add link to Admin Login */}
        <Link to="/business/login" className="nav-link">Business Login</Link> {/* Add link to Business Login */}
        <Link to="/login" className="nav-link">Login</Link>
        <Link to="/register" className="nav-link">Register</Link>
      </div>
    </nav>
  );
}

export default Navbar;
