import React from 'react';
import BusinessSearch from './BusinessSearch';

function Home() {
  return (
    <div>
      <h1>Welcome to Gifty!</h1>
      <p>Send meaningful experiences to your loved ones.</p>
      <BusinessSearch />
      {/* Add featured businesses here */}
    </div>
  );
}

export default Home;
