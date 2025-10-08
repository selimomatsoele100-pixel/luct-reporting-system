// Mock auth service - no actual backend calls
export const authService = {
  login: async (email, password) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock validation
    if (password === 'password' && email.includes('@luct.ac.ls')) {
      return {
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 1,
            email: email,
            name: email.split('@')[0].replace('.', ' '),
            role: email.includes('student') ? 'student' : 
                  email.includes('prl') ? 'prl' :
                  email.includes('pl') ? 'pl' : 'lecturer',
            faculty: 'FICT',
            program: 'Information Technology'
          }
        }
      };
    }
    throw new Error('Invalid email or password');
  },
  
  register: async (userData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      data: {
        token: 'mock-jwt-token',
        user: {
          id: Date.now(),
          ...userData,
          created_at: new Date().toISOString()
        }
      }
    };
  },
  
  getProfile: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userData = localStorage.getItem('user');
    if (userData) {
      return {
        data: {
          user: JSON.parse(userData)
        }
      };
    }
    throw new Error('Not authenticated');
  }
};