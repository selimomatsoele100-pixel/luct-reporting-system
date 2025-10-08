const exportToExcel = async (type) => {
  try {
    let endpoint = '';
    let filename = '';

    switch (type) {
      case 'my-reports':
        endpoint = '/api/export/my-reports';
        filename = 'my-reports';
        break;
      case 'monitoring':
        endpoint = '/api/export/monitoring';
        filename = 'monitoring-data';
        break;
      case 'all-data':
        endpoint = '/api/export/all-data';
        filename = 'all-system-data';
        break;
      case 'my-data':
        endpoint = '/api/export/my-data';
        filename = 'my-personal-data';
        break;
      default:
        return;
    }

    // Make the request to download Excel file
    const response = await api.get(endpoint, {
      responseType: 'blob' // Important for file downloads
    });

    // Create blob from response
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Get filename from response headers or use default
    const contentDisposition = response.headers['content-disposition'];
    let downloadFilename = filename + '.xlsx';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        downloadFilename = filenameMatch[1];
      }
    }
    
    link.download = downloadFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    alert(`✅ Data exported successfully as ${downloadFilename}`);

  } catch (error) {
    console.error('Export error:', error);
    alert('❌ Failed to export data. Please try again.');
  }
};