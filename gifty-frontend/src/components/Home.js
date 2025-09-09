import React from 'react';
import BusinessSearch from './BusinessSearch';
import './Home.css';
import { Typography, Box, Container } from '@mui/material'; // Import Material UI components

function Home() {
  return (
    <Container maxWidth="md" className="home-container"> {/* Use Material UI Container */}
      <Box sx={{ my: 4, textAlign: 'center' }}> {/* Use Material UI Box for spacing and alignment */}
        <Typography variant="h1" component="h1" gutterBottom>
          Welcome to Gifty!
        </Typography>
        <Typography variant="h5" component="p" color="text.secondary" paragraph>
          Send meaningful experiences to your loved ones.
        </Typography>
      </Box>
      <BusinessSearch />
      {/* Add featured businesses here */}
    </Container>
  );
}

export default Home;
