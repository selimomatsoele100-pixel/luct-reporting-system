import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navigation from '../components/Navigation';

// Inline ComplaintForm component to avoid import issues
const ComplaintForm = ({ onComplaintCreated }) => {
  const { user } = useAuth();
  const [complaintText, setComplaintText] = useState('');
  const [complaintAgainst, setComplaintAgainst] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailableUsers();
  }, []);

  const fetchAvailableUsers = async () => {
    try {
      // Based on user role, fetch appropriate users to complain against
      let endpoint = '';
      switch(user?.role) {
        case 'student':
          endpoint = '/users/role/lecturer';
          break;
        case 'lecturer':
          endpoint = '/users/role/prl';
          break;
        case 'prl':
          endpoint = '/users/role/pl';
          break;
        case 'pl':
          endpoint = '/users/role/fmg';
          break;
        default:
          return;
      }
      
      const response = await api.get(endpoint);
      setAvailableUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complaintText.trim() || !complaintAgainst) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/complaints', {
        complaint_text: complaintText,
        complaint_against_id: complaintAgainst
      });
      onComplaintCreated(response.data);
      setComplaintText('');
      setComplaintAgainst('');
    } catch (error) {
      console.error('Error filing complaint:', error);
      alert('Error filing complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <h3>File New Complaint</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Complaint Against:
          </label>
          <select 
            value={complaintAgainst}
            onChange={(e) => setComplaintAgainst(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #404040', background: '#1a1a1a', color: 'white' }}
            required
          >
            <option value="">Select User</option>
            {availableUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} - {user.role.toUpperCase()} - {user.faculty}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Complaint Details:
          </label>
          <textarea 
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            placeholder="Describe your complaint in detail..."
            rows="4"
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #404040', background: '#1a1a1a', color: 'white' }}
            required
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Filing Complaint...' : 'File Complaint'}
        </button>
      </form>
    </div>
  );
};

const Complaints = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchComplaints();
  }, [user]);

  const fetchComplaints = async () => {
    try {
      const [myComplaints, againstMe] = await Promise.all([
        api.get('/complaints/my-complaints'),
        api.get('/complaints/against-me')
      ]);
      
      // Combine and mark ownership
      const myComplaintsWithType = myComplaints.data.map(c => ({ ...c, type: 'filed' }));
      const againstMeWithType = againstMe.data.map(c => ({ ...c, type: 'received' }));
      
      setComplaints([...myComplaintsWithType, ...againstMeWithType]);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };

  const handleComplaintCreated = (newComplaint) => {
    setComplaints(prev => [{ ...newComplaint, type: 'filed' }, ...prev]);
    setShowForm(false);
    alert('Complaint filed successfully! You will receive a response soon.');
  };

  const handleRespond = async (complaintId) => {
    const response = prompt('Enter your response to this complaint:');
    if (response && response.trim()) {
      try {
        await api.patch(`/complaints/${complaintId}/respond`, { response_text: response });
        await fetchComplaints();
        alert('Response submitted successfully!');
      } catch (error) {
        console.error('Error responding to complaint:', error);
        alert('Error submitting response');
      }
    }
  };

  const getComplaintTitle = (complaint) => {
    if (complaint.type === 'filed') {
      return `You complained against ${complaint.complaint_against_name} (${complaint.complaint_against_role.toUpperCase()})`;
    } else {
      return `${complaint.complainant_name} (${complaint.complainant_role.toUpperCase()}) complained against you`;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: '#ffc107', text: 'PENDING REVIEW' },
      reviewed: { color: '#17a2b8', text: 'UNDER REVIEW' },
      resolved: { color: '#28a745', text: 'RESOLVED' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '0.8em',
        backgroundColor: config.color,
        color: 'white',
        fontWeight: 'bold'
      }}>
        {config.text}
      </span>
    );
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (activeTab === 'filed') return complaint.type === 'filed';
    if (activeTab === 'received') return complaint.type === 'received';
    return true;
  });

  const canFileComplaint = user?.role !== 'fmg';

  return (
    <div>
      <Navigation />
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>Complaints Management</h1>
          {canFileComplaint && (
            <button 
              className="btn btn-primary" 
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Cancel' : 'File New Complaint'}
            </button>
          )}
        </div>

        {showForm && <ComplaintForm onComplaintCreated={handleComplaintCreated} />}

        <div className="card">
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #404040', paddingBottom: '10px' }}>
            <button 
              className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('all')}
            >
              All Complaints
            </button>
            <button 
              className={`btn ${activeTab === 'filed' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('filed')}
            >
              Filed by Me
            </button>
            <button 
              className={`btn ${activeTab === 'received' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('received')}
            >
              Against Me
            </button>
          </div>

          <h3>
            {activeTab === 'all' && 'All Complaints'}
            {activeTab === 'filed' && 'Complaints Filed by You'}
            {activeTab === 'received' && 'Complaints Against You'}
          </h3>

          {filteredComplaints.length === 0 ? (
            <p>No complaints found.</p>
          ) : (
            <div>
              {filteredComplaints.map(complaint => (
                <div key={complaint.id} className="card" style={{ marginBottom: '15px', borderLeft: `4px solid ${complaint.type === 'filed' ? '#007bff' : '#dc3545'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, flex: 1 }}>{getComplaintTitle(complaint)}</h4>
                    {getStatusBadge(complaint.status)}
                  </div>
                  
                  <p style={{ marginBottom: '10px' }}><strong>Complaint:</strong> {complaint.complaint_text}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <small style={{ color: '#ccc' }}>
                        Filed on: {new Date(complaint.created_at).toLocaleDateString()} | 
                        Faculty: {complaint.faculty}
                      </small>
                    </div>
                    
                    {complaint.response_text && (
                      <div style={{ flexBasis: '100%', marginTop: '10px', padding: '10px', background: '#1a1a1a', borderRadius: '4px' }}>
                        <strong>Response:</strong> {complaint.response_text}
                      </div>
                    )}
                    
                    {complaint.type === 'received' && !complaint.response_text && (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleRespond(complaint.id)}
                      >
                        Respond
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Complaint guidelines */}
        <div className="card">
          <h3>Complaint Guidelines</h3>
          <div style={{ lineHeight: '1.6' }}>
            <p><strong>Proper Complaint Flow:</strong></p>
            <ul style={{ paddingLeft: '20px', color: '#ccc' }}>
              <li>Students → Lecturers</li>
              <li>Lecturers → Principal Lecturers (PRL)</li>
              <li>Principal Lecturers → Program Leaders (PL)</li>
              <li>Program Leaders → Faculty Management (FMG)</li>
            </ul>
            <p style={{ marginTop: '10px', fontStyle: 'italic', color: '#888' }}>
              All complaints are confidential and will be handled according to LUCT policies.
              You will receive a response from the relevant authority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Complaints;