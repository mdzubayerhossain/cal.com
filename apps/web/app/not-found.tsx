import React from "react";
import { Link } from "react-router-dom";
import "./NotFound.css"; // Import a CSS file for styles

const NotFound = () => {
  return (
    <div className="not-found-container" data-testid="404-page">
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      <img
        src="https://example.com/404-image.png" // Replace with a relevant image URL
        alt="404 Not Found"
        className="not-found-image"
      />
      <Link to="/" className="home-button">
        Go Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
