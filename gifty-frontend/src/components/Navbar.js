import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'; // Import Material UI components
import './Navbar.css';

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  return (
    <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: 'background.paper' }}>
      <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto' }}>
        <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'primary.main', fontWeight: 700, letterSpacing: '-0.5px' }}>
          Gifty
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button component={Link} to="/businesses" color="inherit" sx={{ color: 'text.secondary' }}>
            Businesses
          </Button>

          {isLoggedIn ? (
            <>
              {userRole === 'user' && (
                <Button component={Link} to="/dashboard" color="inherit" sx={{ color: 'text.secondary' }}>
                  My Dashboard
                </Button>
              )}
              {userRole === 'business' && (
                <Button component={Link} to="/business/dashboard" color="inherit" sx={{ color: 'text.secondary' }}>
                  Business Dashboard
                </Button>
              )}
              {userRole === 'admin' && (
                <Button component={Link} to="/admin/dashboard" color="inherit" sx={{ color: 'text.secondary' }}>
                  Admin Dashboard
                </Button>
              )}
              <Button onClick={() => setIsLoggedIn(false)} variant="contained" color="primary">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button component={Link} to="/login" color="primary" variant="outlined">
                Login
              </Button>
              <Button component={Link} to="/register" color="primary" variant="contained">
                Register
              </Button>
              <Button component={Link} to="/business/login" color="inherit" sx={{ color: 'text.secondary' }}>
                Business Login
              </Button>
              <Button component={Link} to="/admin/login" color="inherit" sx={{ color: 'text.secondary' }}>
                Admin Login
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
