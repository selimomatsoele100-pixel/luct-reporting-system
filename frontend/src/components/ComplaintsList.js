import React, { useState, useEffect } from 'react';
import { complaintsAPI } from '../api';

const ComplaintsList = ({ user }) => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, [user]);

  useEffect(() => {
    filterComplaints();
  }, [complaints, searchTerm, activeTab]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      let response;
      
      if (activeTab === 'my-complaints') {
        response = await complaintsAPI.getMyComplaints();
      } else if (activeTab === 'for-me') {
        response = await complaintsAPI.getComplaintsForMe();
      } else {
        response = await complaintsAPI.getAll();
      }
      
      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterComplaints = () => {
    let filtered = complaints;

    if (searchTerm) {
      filtered = filtered.filter(complaint => 
        complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (complaint.target_name && complaint.target_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (complaint.complainant_name && complaint.complainant_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredComplaints(filtered);
  };

  const respondToComplaint = async (complaintId) => {
    if (!responseText.trim()) {
      alert('Please enter a response.');
      return;
    }

    try {
      await complaintsAPI.respond(complaintId, responseText);
      setRespondingTo(null);
      setResponseText('');
      fetchComplaints(); // Refresh the list
      alert('Response submitted successfully!');
    } catch (error) {
      alert('Failed to submit response: ' + (error.response?.data?.error || 'Please try again.'));
    }
  };

  const downloadComplaint = (complaint) => {
    const complaintData = `
LUCT COMPLAINT SYSTEM
=====================

COMPLAINT DETAILS
-----------------
Title: ${complaint.title}
Type: ${complaint.complaint_type.toUpperCase()}
Status: ${complaint.status}
Filed: ${new Date(complaint.created_at).toLocaleString()}

FROM
----
Complainant: ${complaint.complainant_name || 'N/A'}
Role: ${complaint.complainant_role || 'N/A'}

TO
--
Target: ${complaint.target_name || 'N/A'}
Role: ${complaint.target_role || 'N/A'}

DESCRIPTION
-----------
${complaint.description}

${complaint.response ? `
RESPONSE
--------
${complaint.response}

Responded: ${complaint.responded_at ? new Date(complaint.responded_at).toLocaleString() : 'N/A'}
` : 'RESPONSE: Pending'}
    `;

    const blob = new Blob([complaintData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaint-${complaint.id}-${complaint.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'status-pending',
      reviewed: 'status-reviewed',
      resolved: 'status-resolved'
    };
    return <span className={statusClasses[status]}>{status.toUpperCase()}</span>;
  };

  if (loading) {
    return <div className="loading">Loading complaints...</div>;
  }

  return (
    <div className="card">
      <h2>Complaints Management</h2>

      {/* Search Box */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search by title, complainant, or target..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('all');
            fetchComplaints();
          }}
        >
          All Complaints
        </button>
        <button 
          className={`nav-tab ${activeTab === 'my-complaints' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('my-complaints');
            fetchComplaints();
          }}
        >
          My Complaints
        </button>
        <button 
          className={`nav-tab ${activeTab === 'for-me' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('for-me');
            fetchComplaints();
          }}
        >
          For My Response
        </button>
      </div>

      {/* Complaints Table */}
      <div className="tab-content">
        {filteredComplaints.length === 0 ? (
          <p>No complaints found.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>From</th>
                <th>To</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map(complaint => (
                <React.Fragment key={complaint.id}>
                  <tr>
                    <td>
                      <strong>{complaint.title}</strong>
                      {complaint.description.length > 100 && (
                        <div style={{ fontSize: '0.9rem', color: '#cccccc', marginTop: '0.25rem' }}>
                          {complaint.description.substring(0, 100)}...
                        </div>
                      )}
                    </td>
                    <td>{complaint.complainant_name || 'N/A'}</td>
                    <td>{complaint.target_name || 'N/A'}</td>
                    <td>{complaint.complaint_type.toUpperCase()}</td>
                    <td>{getStatusBadge(complaint.status)}</td>
                    <td>{new Date(complaint.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => downloadComplaint(complaint)}
                        >
                          Download
                        </button>
                        
                        {complaint.target_user_id === user.id && complaint.status === 'pending' && (
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => setRespondingTo(complaint.id)}
                          >
                            Respond
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  
                  {/* Response Form */}
                  {respondingTo === complaint.id && (
                    <tr>
                      <td colSpan="7" style={{ backgroundColor: '#2c2c2c', padding: '1rem' }}>
                        <div>
                          <h4>Respond to Complaint</h4>
                          <textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            className="form-control"
                            rows="4"
                            placeholder="Enter your response to this complaint..."
                            style={{ marginBottom: '1rem' }}
                          />
                          <div className="action-buttons">
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={() => respondToComplaint(complaint.id)}
                            >
                              Submit Response
                            </button>
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => {
                                setRespondingTo(null);
                                setResponseText('');
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Show response if exists */}
                  {complaint.response && (
                    <tr>
                      <td colSpan="7" style={{ backgroundColor: '#2c2c2c', padding: '1rem' }}>
                        <div>
                          <strong>Response:</strong>
                          <p style={{ marginTop: '0.5rem', color: '#cccccc' }}>{complaint.response}</p>
                          {complaint.responded_at && (
                            <small style={{ color: '#888' }}>
                              Responded: {new Date(complaint.responded_at).toLocaleString()}
                            </small>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons" style={{ marginTop: '2rem' }}>
        <a href="/complaints/new" className="btn btn-primary">File New Complaint</a>
        <a href="/dashboard" className="btn btn-danger">Back to Dashboard</a>
      </div>
    </div>
  );
};

export default ComplaintsList;