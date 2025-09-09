import React, { useState } from 'react';
import { TextField, Button, Typography, Box } from '@mui/material'; // Import Material UI components

function BusinessSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', searchTerm, 'in', location);
  };

  return (
    <Box className="business-search" sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper', borderRadius: '10px', boxShadow: 3, maxWidth: 900, mx: 'auto', my: 4 }}>
      <Typography variant="h2" component="h2" gutterBottom>
        Find a Business
      </Typography>
      <form onSubmit={handleSearch} style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <TextField
          label="Business Name"
          variant="outlined"
          placeholder="Restaurant, Hotel, or Business Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 300, maxWidth: '100%' }}
        />
        <TextField
          label="Location"
          variant="outlined"
          placeholder="Location (e.g., City, Region)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          sx={{ width: 300, maxWidth: '100%' }}
        />
        <Button type="submit" variant="contained" color="primary" size="large">
          Search
        </Button>
      </form>
      {/* Display search results here */}
    </Box>
  );
}

export default BusinessSearch;
