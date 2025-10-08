import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename = 'export') => {
  if (!data || data.length === 0) {
    alert('No data available to export');
    return;
  }

  try {
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Error exporting data to Excel');
  }
};

export const exportReportsToExcel = (reports) => {
  if (!reports || reports.length === 0) {
    alert('No reports data available to export');
    return;
  }

  const exportData = reports.map(report => ({
    'Faculty': report.faculty || 'N/A',
    'Class Name': report.class_name || 'N/A',
    'Week': report.week_of_reporting || 'N/A',
    'Date': report.date_of_lecture || 'N/A',
    'Course': report.course_name || 'N/A',
    'Course Code': report.course_code || 'N/A',
    'Lecturer': report.lecturer_name || 'N/A',
    'Students Present': report.students_present || 0,
    'Total Students': report.total_students || 0,
    'Attendance Rate': report.students_present && report.total_students 
      ? `${Math.round((report.students_present / report.total_students) * 100)}%`
      : '0%',
    'Venue': report.venue || 'N/A',
    'Scheduled Time': report.scheduled_time || 'N/A',
    'Topic Taught': report.topic_taught || 'N/A',
    'Learning Outcomes': report.learning_outcomes || 'N/A',
    'Recommendations': report.recommendations || 'N/A',
    'Status': report.status || 'pending',
    'Created At': report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'
  }));
  
  exportToExcel(exportData, 'lecture_reports');
};

export const exportMonitoringToExcel = (monitoringData) => {
  if (!monitoringData || monitoringData.length === 0) {
    alert('No monitoring data available to export');
    return;
  }

  const exportData = monitoringData.map(record => ({
    'Faculty': record.faculty || 'N/A',
    'Class': record.className || record.class_name || 'N/A',
    'Course': record.courseName || record.course_name || 'N/A',
    'Course Code': record.courseCode || record.course_code || 'N/A',
    'Lecturer': record.lecturer || record.lecturer_name || 'N/A',
    'Week': record.week || record.week_of_reporting || 'N/A',
    'Date': record.date || record.date_of_lecture || 'N/A',
    'Students Present': record.present || record.students_present || 0,
    'Total Students': record.registered || record.total_students || 0,
    'Attendance Rate': record.attendanceRate || 
      (record.present && record.registered ? `${Math.round((record.present / record.registered) * 100)}%` : '0%'),
    'Venue': record.venue || 'N/A',
    'Scheduled Time': record.scheduledTime || record.scheduled_time || 'N/A'
  }));
  
  exportToExcel(exportData, 'monitoring_data');
};

export const exportRatingsToExcel = (ratings) => {
  if (!ratings || ratings.length === 0) {
    alert('No ratings data available to export');
    return;
  }

  const exportData = ratings.map(rating => ({
    'Lecturer': rating.lecturer || 'N/A',
    'Course': rating.course || 'N/A',
    'Course Code': rating.courseCode || 'N/A',
    'Rating': rating.rating || 0,
    'Category': rating.category || 'N/A',
    'Comment': rating.comment || 'N/A',
    'Student': rating.studentName || rating.user?.name || 'Anonymous',
    'Date': rating.date || (rating.created_at ? new Date(rating.created_at).toLocaleDateString() : 'N/A')
  }));
  
  exportToExcel(exportData, 'ratings_data');
};

export const exportComplaintsToExcel = (complaints) => {
  if (!complaints || complaints.length === 0) {
    alert('No complaints data available to export');
    return;
  }

  const exportData = complaints.map(complaint => ({
    'Title': complaint.title || 'N/A',
    'Description': complaint.description || 'N/A',
    'Category': complaint.category || 'N/A',
    'Priority': complaint.priority || 'medium',
    'Status': complaint.status || 'pending',
    'Submitted By': complaint.submitted_by || complaint.user?.name || 'Anonymous',
    'Assigned To': complaint.assigned_to || 'N/A',
    'Created Date': complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : 'N/A',
    'Resolution': complaint.resolution || 'Not resolved'
  }));
  
  exportToExcel(exportData, 'complaints_data');
};

export const exportUsersToExcel = (users) => {
  if (!users || users.length === 0) {
    alert('No users data available to export');
    return;
  }

  const exportData = users.map(user => ({
    'Name': user.name || 'N/A',
    'Email': user.email || 'N/A',
    'Role': user.role || 'N/A',
    'Faculty': user.faculty || 'N/A',
    'Program': user.program || 'N/A',
    'Class': user.class_name || 'N/A',
    'Status': user.status || 'active',
    'Created At': user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
    'Last Login': user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'
  }));
  
  exportToExcel(exportData, 'users_data');
};