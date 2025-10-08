// Mock API service - no actual backend calls
const api = {
  get: async (url) => {
    console.log(`🔄 Mock API GET: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock responses based on endpoint
    if (url === '/courses') {
      return {
        data: [
          { id: 1, course_code: 'DIWA2110', course_name: 'Web Application Development', faculty: 'FICT' },
          { id: 2, course_code: 'DIDB2110', course_name: 'Database Systems', faculty: 'FICT' },
          { id: 3, course_code: 'DIPR2110', course_name: 'Programming Fundamentals', faculty: 'FICT' }
        ]
      };
    }
    
    if (url === '/courses/classes') {
      return {
        data: [
          { id: 1, class_name: 'DIT-1A', faculty: 'FICT', program: 'Diploma in IT' },
          { id: 2, class_name: 'BIT-2B', faculty: 'FICT', program: 'BSc in IT' },
          { id: 3, class_name: 'BBIT-1C', faculty: 'FICT', program: 'BSc in Business IT' }
        ]
      };
    }
    
    if (url === '/complaints/my-complaints') {
      return { data: [] };
    }
    
    if (url === '/reports/my-reports') {
      return { data: [] };
    }
    
    if (url === '/reports/all') {
      return { data: [] };
    }
    
    return { data: [] };
  },
  
  post: async (url, data) => {
    console.log(`🔄 Mock API POST: ${url}`, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (url === '/reports') {
      return {
        data: {
          report: {
            id: Date.now(),
            ...data,
            created_at: new Date().toISOString(),
            status: 'pending'
          }
        }
      };
    }
    
    return { data: { success: true } };
  },
  
  put: async (url, data) => {
    console.log(`🔄 Mock API PUT: ${url}`, data);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: { success: true } };
  },
  
  delete: async (url) => {
    console.log(`🔄 Mock API DELETE: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { data: { success: true } };
  }
};

export default api;