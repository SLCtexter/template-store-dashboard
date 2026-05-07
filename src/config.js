// Configuration for the dashboard
const config = {
  // The URL of the invitation website (production or development)
  // Invitation URL: cordinally.inviteyou.lk/wedding/kalana-chanchala/
  invitationBaseUrl: process.env.NODE_ENV === 'production' 
    ? "https://cordially.inviteyou.lk/wedding/kalana-chanchala/" 
    : "http://localhost:3001/"
};

export default config;
