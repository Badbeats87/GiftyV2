import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Businesses.css';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Button, Box } from '@mui/material'; // Import Material UI components

function Businesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/businesses');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setBusinesses(data);
      } catch (err) {
        setError('Failed to fetch businesses.');
        console.error('Error fetching businesses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  if (loading) {
    return (
      <Container className="businesses-container" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5">Loading businesses...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="businesses-container error" sx={{ py: 4, textAlign: 'center', color: 'error.main' }}>
        <Typography variant="h5">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container className="businesses-container" sx={{ py: 4, textAlign: 'center' }}>
      <Typography variant="h2" component="h2" gutterBottom>
        Our Partner Businesses
      </Typography>
      <Grid container spacing={4} justifyContent="center">
        {businesses.map(business => (
          <Grid item key={business.id} xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={business.logo_url || 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Logo'}
                alt={business.name}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h3">
                  {business.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {business.business_type || 'Type N/A'} - {business.address || 'Location N/A'}
                </Typography>
              </CardContent>
              <Box sx={{ p: 2 }}>
                <Button
                  component={Link}
                  to={`/businesses/${business.id}`}
                  variant="contained"
                  color="primary"
                  fullWidth
                >
                  View Details
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default Businesses;
