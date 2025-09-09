import React, { useState } from 'react';

function BusinessSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // In a real application, this would trigger an API call to search for businesses
    console.log('Searching for:', searchTerm, 'in', location);
    // For now, we'll just log the search terms
  };

  return (
    <div className="business-search">
      <h2>Find a Business</h2>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Restaurant, Hotel, or Business Name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <input
          type="text"
          placeholder="Location (e.g., City, Region)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
      {/* Display search results here */}
    </div>
  );
}

export default BusinessSearch;
