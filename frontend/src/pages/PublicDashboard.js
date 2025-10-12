import React from "react";
import { Link } from "react-router-dom";
import PublicHeader from "../components/PublicHeader";

const PublicDashboard = ({
  title = "LUCT Reporting System",
  description = "Streamline academic reporting, monitoring, and feedback across all faculties.",
  features = [],
  stats = [],
}) => {
  return (
    <div className="public-dashboard">
      <PublicHeader />

      <div className="container">
        {/* Hero Section */}
        <div className="public-hero">
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="auth-buttons">
            <Link to="/login" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          {features && features.length > 0 ? (
            features.map((feature, index) => (
              <div key={index} className="feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))
          ) : (
            <p className="text-muted" style={{ textAlign: "center" }}>
              No features available. Please check back later.
            </p>
          )}
        </div>

        {/* Stats Section */}
        {stats && stats.length > 0 && (
          <div style={{ marginTop: "60px", textAlign: "center" }}>
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-number">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div
          style={{
            textAlign: "center",
            marginTop: "60px",
            padding: "40px",
          }}
        >
          <h2 style={{ color: "#f8fafc", marginBottom: "20px" }}>
            Ready to Get Started?
          </h2>
          <p
            style={{
              color: "#cbd5e1",
              marginBottom: "30px",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Join faculty members and students using the LUCT Reporting System to
            enhance academic transparency and efficiency.
          </p>
        </div>
      </div>
    </div>
  );
};

// Default props (optional placeholders)
PublicDashboard.defaultProps = {
  features: [],
  stats: [],
};

export default PublicDashboard;
