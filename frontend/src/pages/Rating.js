import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navigation from '../components/Navigation';
import { exportRatingsToExcel } from '../utils/exportToExcel';

const Rating = () => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [courses, setCourses] = useState([]);
  const [newRating, setNewRating] = useState({
    lecturer: '',
    course: '',
    rating: 0,
    comment: '',
    category: 'teaching'
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [ratingsResponse, coursesResponse] = await Promise.all([
        api.get('/ratings'),
        api.get('/courses')
      ]);
      
      // Ensure ratings is always an array and filter out any undefined/null items
      const ratingsData = Array.isArray(ratingsResponse.data) ? ratingsResponse.data : [];
      const safeRatings = ratingsData.filter(rating => rating != null);
      
      setRatings(safeRatings);
      setCourses(Array.isArray(coursesResponse.data) ? coursesResponse.data : []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load data');
      setRatings([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (e) => {
    const { name, value } = e.target;
    setNewRating(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStarClick = (ratingValue) => {
    setNewRating(prev => ({
      ...prev,
      rating: ratingValue
    }));
  };

  const submitRating = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await api.post('/ratings', {
        ...newRating,
        user_id: user?.id,
        studentName: user?.name || 'Anonymous Student'
      });
      
      // Ensure the new rating is valid before adding to state
      if (response.data?.rating) {
        setRatings(prev => [response.data.rating, ...prev]);
      }
      
      setNewRating({
        lecturer: '',
        course: '',
        rating: 0,
        comment: '',
        category: 'teaching'
      });
      
      alert('Rating submitted successfully! Thank you for your feedback.');
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    exportRatingsToExcel(ratings);
  };

  const getAverageRating = () => {
    if (ratings.length === 0) return 0;
    const validRatings = ratings.filter(rating => rating && typeof rating.rating === 'number');
    if (validRatings.length === 0) return 0;
    
    const total = validRatings.reduce((acc, curr) => acc + curr.rating, 0);
    return (total / validRatings.length).toFixed(1);
  };

  const renderStars = (rating) => {
    const numericRating = rating || 0;
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`star ${index < numericRating ? 'active' : ''}`}
      >
        {index < numericRating ? '★' : '☆'}
      </span>
    ));
  };

  // Get unique lecturers from existing ratings for suggestions - with safe filtering
  const existingLecturers = [...new Set(
    ratings
      .filter(rating => rating && rating.lecturer)
      .map(rating => rating.lecturer)
      .filter(Boolean)
  )];

  // Safe rating item component to handle undefined ratings
  const RatingItem = ({ rating }) => {
    if (!rating) return null;
    
    return (
      <div className="rating-item">
        <div className="rating-header">
          <div className="rating-info">
            <h4 style={{ color: '#f8fafc', margin: '0 0 5px 0' }}>
              {rating.lecturer || 'N/A'}
            </h4>
            <span className="course" style={{ color: '#cbd5e1' }}>
              {rating.course || 'N/A'} 
              {rating.courseCode && ` (${rating.courseCode})`}
            </span>
          </div>
          <div className="rating-meta">
            <div className="rating-stars" style={{ marginBottom: '5px' }}>
              {renderStars(rating.rating)}
            </div>
            <span className="rating-value" style={{ 
              color: '#f59e0b', 
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}>
              {(rating.rating || 0)}/5
            </span>
          </div>
        </div>
        {rating.comment && (
          <p className="rating-comment" style={{ 
            color: '#e2e8f0', 
            lineHeight: '1.5',
            margin: '10px 0',
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px'
          }}>
            "{rating.comment}"
          </p>
        )}
        <div className="rating-footer" style={{ 
          display: 'flex', 
          gap: '15px',
          fontSize: '0.8rem',
          color: '#94a3b8'
        }}>
          <span className="student">
            By: {rating.studentName || rating.user?.name || 'Anonymous'}
          </span>
          <span className="category" style={{ 
            textTransform: 'capitalize',
            backgroundColor: 'rgba(100, 116, 139, 0.3)',
            padding: '2px 8px',
            borderRadius: '12px'
          }}>
            {rating.category || 'general'}
          </span>
          <span className="date">
            {rating.date || (rating.created_at ? new Date(rating.created_at).toLocaleDateString() : 'N/A')}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="container">
          <div className="login-container">Loading ratings...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navigation />
      <div className="container">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div className="rating-header">
              <h1>Course & Lecturer Ratings</h1>
              <p>Share your feedback about courses and lecturers</p>
            </div>
            {ratings.length > 0 && (
              <div className="export-buttons">
                <button onClick={handleExportExcel} className="btn btn-success">
                  📊 Export to Excel
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {/* Rating Summary */}
          <div className="rating-summary">
            <div className="summary-card">
              <h3>Overall Rating</h3>
              <div className="overall-rating">
                <span className="rating-value">{getAverageRating()}</span>
                <div className="rating-stars">
                  {renderStars(Math.round(parseFloat(getAverageRating())))}
                </div>
                <span className="rating-count">({ratings.length} ratings)</span>
              </div>
            </div>
          </div>

          <div className="rating-content">
            {/* Add Rating Form */}
            <div className="card">
              <h2>Add Your Rating</h2>
              <form onSubmit={submitRating} className="rating-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Lecturer Name *</label>
                    <input
                      type="text"
                      name="lecturer"
                      value={newRating.lecturer}
                      onChange={handleRatingChange}
                      required
                      placeholder="Enter lecturer's full name"
                      list="lecturer-suggestions"
                    />
                    {/* Suggestions datalist */}
                    <datalist id="lecturer-suggestions">
                      {existingLecturers.map((lecturer, index) => (
                        <option key={index} value={lecturer} />
                      ))}
                    </datalist>
                    <small style={{ color: '#94a3b8', marginTop: '5px', display: 'block' }}>
                      Start typing to see suggestions from previous ratings
                    </small>
                  </div>
                  <div className="form-group">
                    <label>Course *</label>
                    <select
                      name="course"
                      value={newRating.course}
                      onChange={handleRatingChange}
                      required
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.course_name}>
                          {course.course_name} ({course.course_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Rating Category</label>
                  <select
                    name="category"
                    value={newRating.category}
                    onChange={handleRatingChange}
                  >
                    <option value="teaching">Teaching Quality</option>
                    <option value="materials">Course Materials</option>
                    <option value="communication">Communication</option>
                    <option value="engagement">Student Engagement</option>
                    <option value="feedback">Feedback & Assessment</option>
                    <option value="overall">Overall Experience</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Your Rating *</label>
                  <div className="star-rating-input">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`star ${star <= newRating.rating ? 'active' : ''}`}
                        onClick={() => handleStarClick(star)}
                        style={{ cursor: 'pointer', fontSize: '2rem', margin: '0 5px' }}
                      >
                        {star <= newRating.rating ? '★' : '☆'}
                      </span>
                    ))}
                    <span className="rating-value-display" style={{ marginLeft: '15px', fontSize: '1.1rem', fontWeight: 'bold' }}>
                      {newRating.rating > 0 ? `${newRating.rating}/5` : 'Click stars to rate'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.8rem', color: '#94a3b8' }}>
                    <span>Poor</span>
                    <span>Excellent</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Your Feedback</label>
                  <textarea
                    name="comment"
                    value={newRating.comment}
                    onChange={handleRatingChange}
                    rows="4"
                    placeholder="Share your experience, what you liked, and suggestions for improvement..."
                    style={{ resize: 'vertical' }}
                  />
                  <small style={{ color: '#94a3b8' }}>
                    Your feedback helps improve teaching quality and learning experience
                  </small>
                </div>

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submitting || !newRating.lecturer.trim() || !newRating.course || newRating.rating === 0}
                    style={{ padding: '12px 30px', fontSize: '1rem' }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Rating'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setNewRating({
                      lecturer: '',
                      course: '',
                      rating: 0,
                      comment: '',
                      category: 'teaching'
                    })}
                    style={{ padding: '12px 30px', fontSize: '1rem' }}
                  >
                    Clear Form
                  </button>
                </div>
              </form>
            </div>

            {/* Ratings List */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Recent Ratings</h2>
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                  {ratings.length} rating{ratings.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="ratings-list">
                {ratings.map((rating, index) => (
                  <RatingItem key={rating?.id || index} rating={rating} />
                ))}
              </div>
              {ratings.length === 0 && !error && (
                <div className="no-ratings" style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  color: '#94a3b8',
                  fontStyle: 'italic'
                }}>
                  <p>No ratings yet. Be the first to share your feedback!</p>
                  <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                    Your ratings help improve the learning experience for everyone.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rating;