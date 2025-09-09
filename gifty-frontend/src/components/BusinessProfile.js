import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './BusinessProfile.css';
import { Container, Typography, Box, Card, CardMedia, Button, Grid } from '@mui/material'; // Import Material UI components

function BusinessProfile() {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusinessDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/api/businesses/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data) {
          setBusiness(data);
        } else {
          setError('Business not found.');
        }
      } catch (err) {
        setError('Failed to fetch business details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessDetails();
  }, [id]);

  if (loading) {
    return (
      <Container className="business-profile-container" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5">Loading business details...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="business-profile-container error" sx={{ py: 4, textAlign: 'center', color: 'error.main' }}>
        <Typography variant="h5">{error}</Typography>
      </Container>
    );
  }

  if (!business) {
    return (
      <Container className="business-profile-container" sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h5">No business data available.</Typography>
      </Container>
    );
  }

  return (
    <Container className="business-profile-container" sx={{ py: 4, textAlign: 'center', bgcolor: 'background.paper', borderRadius: '10px', boxShadow: 3, maxWidth: 900, mx: 'auto', my: 4 }}>
      <CardMedia
        component="img"
        height="350"
        image={business.logo_url || 'https://via.placeholder.com/400x200/CCCCCC/FFFFFF?text=No+Image'}
        alt={business.name}
        sx={{ borderRadius: '8px', mb: 3 }}
      />
      <Typography variant="h1" component="h1" gutterBottom>
        {business.name}
      </Typography>
      <Typography variant="h6" component="p" color="text.secondary" sx={{ mb: 3 }}>
        {business.business_type || 'Type N/A'} - {business.address || 'Location N/A'}
      </Typography>
      <Typography variant="body1" component="p" sx={{ mb: 4, textAlign: 'left', color: 'text.primary' }}>
        {business.description}
      </Typography>

      <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h2" component="h2" gutterBottom>
          Gift Card Options
        </Typography>
        <Grid container spacing={2} justifyContent="center" sx={{ mb: 4 }}>
          {(() => {
            const giftCardsToDisplay = business.giftCards && business.giftCards.length > 0
              ? business.giftCards
              : [{ value: 10 }, { value: 25 }, { value: 50 }, { value: 100 }];

            return giftCardsToDisplay.map((card, index) => (
              <Grid item key={index}>
                <Card sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, bgcolor: 'background.default', boxShadow: 2 }}>
                  <Typography variant="h6" color="primary">
                    ${card.value}
                  </Typography>
                  <Button
                    component={Link}
                    to={`/purchase/${business.id}/${card.value}`}
                    variant="contained"
                    color="secondary"
                    size="small"
                  >
                    Purchase
                  </Button>
                </Card>
              </Grid>
            ));
          })()}
        </Grid>
      </Box>

      <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h2" component="h2" gutterBottom>
          Terms & Conditions
        </Typography>
        <Typography variant="body2" component="p" color="text.secondary" sx={{ textAlign: 'left' }}>
          {business.terms_and_conditions}
        </Typography>
      </Box>
    </Container>
  );
}

export default BusinessProfile;
