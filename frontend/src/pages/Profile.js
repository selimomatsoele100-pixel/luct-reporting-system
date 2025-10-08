import React from 'react';
import { useAuth } from '../context/AuthContext';
import Navigation from '../components/Navigation';

const Profile = () => {
  const { user } = useAuth();

  const downloadMyData = () => {
    // In a real application, you would fetch user-specific data from the API
    const userData = {
      userInfo: user,
      downloadDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `luct-data-${user?.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Navigation />
      <div className="container">
        <h1>My Profile</h1>
        
        <div className="card">
          <h3>Personal Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <p><strong>Name:</strong> {user?.name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Role:</strong> {user?.role?.toUpperCase()}</p>
            </div>
            <div>
              <p><strong>Faculty:</strong> {user?.faculty}</p>
              <p><strong>Program:</strong> {user?.program || 'Not specified'}</p>
              <p><strong>Member Since:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Data Management</h3>
          <p>You can download your personal data for future reference.</p>
          <button className="btn btn-primary" onClick={downloadMyData}>
            Download My Data
          </button>
        </div>

        <div className="card">
          <h3>System Information</h3>
          <p>LUCT Reporting System v1.0</p>
          <p>This system helps manage academic reporting and communication within the faculty.</p>
          <p>For support, contact: liteboho.molaoa@limkokwing.ac.ls</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;