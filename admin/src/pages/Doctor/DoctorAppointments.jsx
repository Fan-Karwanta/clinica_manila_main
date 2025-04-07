import React, { useContext, useEffect, useState, useRef } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import CancellationModal from '../../components/CancellationModal'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const DoctorAppointments = () => {
  const { dToken, appointments, getAppointments, cancelAppointment, completeAppointment } = useContext(DoctorContext)
  const { slotDateFormat } = useContext(AppContext)
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null)
  const [exportLoading, setExportLoading] = useState(false)
  const tableRef = useRef(null)

  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])

  // Filter appointments based on status and search term
  const filteredAppointments = appointments.filter(app => {
    // Filter by status
    if (activeTab === 'upcoming' && (app.cancelled || app.isCompleted)) return false;
    if (activeTab === 'approved' && (!app.isCompleted || app.cancelled)) return false;
    if (activeTab === 'cancelled' && !app.cancelled) return false;
    
    // Filter by search term
    if (searchTerm.trim() === '') return true;
    
    const fullName = `${app.userData.lastName} ${app.userData.firstName} ${app.userData.middleName}`.toLowerCase();
    const date = slotDateFormat(app.slotDate).toLowerCase();
    const time = app.slotTime.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.includes(searchLower) || date.includes(searchLower) || time.includes(searchLower);
  });

  // Count by status
  const upcomingCount = appointments.filter(app => !app.cancelled && !app.isCompleted).length;
  const approvedCount = appointments.filter(app => !app.cancelled && app.isCompleted).length;
  const cancelledCount = appointments.filter(app => app.cancelled).length;

  // Function to export the current table to PDF
  const exportToPDF = async () => {
    if (!tableRef.current) return;
    
    setExportLoading(true);
    try {
      // Get the appointments to export (filtered or all)
      const appointmentsToExport = filteredAppointments;
      
      // Initialize PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      
      // Add title to first page
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Appointments Report', pageWidth / 2, margin + 10, { align: 'center' });
      
      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, margin + 18, { align: 'center' });
      
      // Add filter information
      pdf.setFontSize(10);
      pdf.text(`Filter: ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Appointments`, pageWidth / 2, margin + 25, { align: 'center' });
      
      // Constants for pagination
      const rowsPerPage = 15;
      const headerHeight = 35; // Space for title, date, and filter info on first page
      const rowHeight = 15; // Approximate height of each row in mm
      const pageStartY = margin + (pdf.getNumberOfPages() === 1 ? headerHeight : 15);
      
      // Function to add header row
      const addTableHeader = (startY) => {
        pdf.setFillColor(243, 244, 246); // #f3f4f6
        pdf.rect(margin, startY, contentWidth, 8, 'F');
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(107, 114, 128); // #6b7280
        
        // Column positions and widths (in percentage of contentWidth)
        const columns = [
          { text: '#', width: 5, align: 'left' },
          { text: 'PATIENT', width: 30, align: 'left' },
          { text: 'DATE & TIME', width: 25, align: 'left' },
          { text: 'STATUS', width: 40, align: 'center' }
        ];
        
        let xPos = margin;
        columns.forEach(col => {
          const colWidth = (contentWidth * col.width) / 100;
          pdf.text(col.text, xPos + 2, startY + 5, { align: col.align === 'center' ? 'center' : 'left' });
          xPos += colWidth;
        });
        
        return startY + 8; // Return the Y position after the header
      };
      
      // Function to add a row
      const addTableRow = (item, index, startY) => {
        const rowStartY = startY;
        pdf.setDrawColor(229, 231, 235); // #e5e7eb
        pdf.setLineWidth(0.1);
        
        // Set text properties
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(55, 65, 81); // #374151
        
        // Column positions (same as header)
        const columns = [
          { width: 5, align: 'left' }, // #
          { width: 30, align: 'left' }, // Patient
          { width: 25, align: 'left' }, // Date & Time
          { width: 40, align: 'center' } // Status
        ];
        
        // Draw row index
        let xPos = margin;
        let colWidth = (contentWidth * columns[0].width) / 100;
        pdf.text((index + 1).toString(), xPos + 2, rowStartY + 4);
        xPos += colWidth;
        
        // Draw patient name
        colWidth = (contentWidth * columns[1].width) / 100;
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${item.userData.lastName}, ${item.userData.firstName}`, xPos + 2, rowStartY + 4);
        if (item.userData.middleName) {
          pdf.setFont('helvetica', 'normal');
          pdf.text(item.userData.middleName || '—', xPos + 2, rowStartY + 8);
        }
        xPos += colWidth;
        
        // Draw date and time
        colWidth = (contentWidth * columns[2].width) / 100;
        pdf.setFont('helvetica', 'normal');
        const formattedDate = slotDateFormat(item.slotDate);
        pdf.text(formattedDate, xPos + 2, rowStartY + 4);
        pdf.text(item.slotTime, xPos + 2, rowStartY + 8);
        xPos += colWidth;
        
        // Draw status with colored background
        colWidth = (contentWidth * columns[3].width) / 100;
        const statusX = xPos + (colWidth / 2);
        const statusText = item.cancelled ? 'Cancelled' : (item.isCompleted ? 'Approved' : 'Pending');
        
        // Set status colors
        if (item.cancelled) {
          pdf.setFillColor(254, 226, 226); // #fee2e2
          pdf.setTextColor(185, 28, 28); // #b91c1c
        } else if (item.isCompleted) {
          pdf.setFillColor(209, 250, 229); // #d1fae5
          pdf.setTextColor(4, 120, 87); // #047857
        } else {
          pdf.setFillColor(254, 243, 199); // #fef3c7
          pdf.setTextColor(146, 64, 14); // #92400e
        }
        
        // Draw status pill
        const pillWidth = 16;
        const pillHeight = 5;
        const pillX = statusX - (pillWidth / 2);
        const pillY = rowStartY + 2;
        pdf.roundedRect(pillX, pillY, pillWidth, pillHeight, 2, 2, 'F');
        
        // Draw status text
        pdf.text(statusText, statusX, rowStartY + 5.5, { align: 'center' });
        
        // Reset text color
        pdf.setTextColor(55, 65, 81); // #374151
        
        // Draw bottom border
        pdf.line(margin, rowStartY + rowHeight, margin + contentWidth, rowStartY + rowHeight);
        
        return rowStartY + rowHeight; // Return the Y position after the row
      };
      
      // Process appointments in batches for each page
      let currentPage = 1;
      let currentY = pageStartY;
      
      // Add header to first page
      currentY = addTableHeader(currentY);
      
      // Process each appointment
      appointmentsToExport.forEach((item, index) => {
        // Check if we need a new page
        if (currentY + rowHeight > pageHeight - margin || 
            (currentPage === 1 && index >= rowsPerPage) || 
            (currentPage > 1 && index >= currentPage * rowsPerPage)) {
          // Add a new page
          pdf.addPage();
          currentPage++;
          currentY = margin + 15; // Reset Y position for new page
          
          // Add page number
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(156, 163, 175); // #9ca3af
          pdf.text(`Page ${currentPage}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
          
          // Add header to new page
          currentY = addTableHeader(currentY);
        }
        
        // Add the row
        currentY = addTableRow(item, index, currentY);
      });
      
      // Add page number to first page
      pdf.setPage(1);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175); // #9ca3af
      pdf.text(`Page 1 of ${pdf.getNumberOfPages()}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
      
      // Add total pages to all pages
      for (let i = 2; i <= pdf.getNumberOfPages(); i++) {
        pdf.setPage(i);
        pdf.text(`Page ${i} of ${pdf.getNumberOfPages()}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
      }
      
      // Save the PDF
      pdf.save(`appointments-${activeTab}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className='bg-gray-50 min-h-screen p-4 sm:p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6'>
          <div>
            <h1 className='text-2xl font-bold text-gray-800'>Appointments</h1>
            <p className='text-gray-600 mt-1'>Manage and track all your patient appointments</p>
          </div>
          
          <div className='flex flex-col sm:flex-row gap-3'>
            {/* Export Button */}
            <button
              onClick={exportToPDF}
              disabled={exportLoading || filteredAppointments.length === 0}
              className={`flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium ${
                exportLoading || filteredAppointments.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors'
              }`}
            >
              {exportLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
              )}
              Export to PDF
            </button>
            
            {/* Search Box */}
            <div className='relative w-full md:w-64'>
              <input
                type='text'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder='Search appointments...'
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
              />
              <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Stats */}
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
          <div className='bg-white rounded-xl shadow-sm p-4 border border-gray-200'>
            <div className='flex justify-between items-center'>
              <div>
                <p className='text-sm text-gray-500'>Total</p>
                <p className='text-2xl font-bold text-gray-800'>{appointments.length}</p>
              </div>
              <div className='bg-blue-100 p-3 rounded-full'>
                <img className='w-6 h-6' src={assets.appointments_icon} alt="" />
              </div>
            </div>
          </div>
          
          <div className='bg-white rounded-xl shadow-sm p-4 border border-gray-200'>
            <div className='flex justify-between items-center'>
              <div>
                <p className='text-sm text-gray-500'>Upcoming</p>
                <p className='text-2xl font-bold text-indigo-600'>{upcomingCount}</p>
              </div>
              <div className='bg-indigo-100 p-3 rounded-full'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div className='bg-white rounded-xl shadow-sm p-4 border border-gray-200'>
            <div className='flex justify-between items-center'>
              <div>
                <p className='text-sm text-gray-500'>Approved</p>
                <p className='text-2xl font-bold text-green-600'>{approvedCount}</p>
              </div>
              <div className='bg-green-100 p-3 rounded-full'>
                <img className='w-6 h-6' src={assets.tick_icon} alt="" />
              </div>
            </div>
          </div>
          
          <div className='bg-white rounded-xl shadow-sm p-4 border border-gray-200'>
            <div className='flex justify-between items-center'>
              <div>
                <p className='text-sm text-gray-500'>Cancelled</p>
                <p className='text-2xl font-bold text-red-600'>{cancelledCount}</p>
              </div>
              <div className='bg-red-100 p-3 rounded-full'>
                <img className='w-6 h-6' src={assets.cancel_icon} alt="" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className='bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
          {/* Tabs */}
          <div className='border-b border-gray-200'>
            <nav className='flex flex-wrap'>
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'all' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All ({appointments.length})
              </button>
              <button 
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'upcoming' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upcoming ({upcomingCount})
              </button>
              <button 
                onClick={() => setActiveTab('approved')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'approved' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Approved ({approvedCount})
              </button>
              <button 
                onClick={() => setActiveTab('cancelled')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'cancelled' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Cancelled ({cancelledCount})
              </button>
            </nav>
          </div>
          
          {/* Table Header */}
          <div ref={tableRef}>
            <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1.5fr_1.5fr] gap-2 py-3 px-6 bg-gray-50 border-b'>
              <p className='text-xs font-medium text-gray-500 uppercase tracking-wider'>#</p>
              <p className='text-xs font-medium text-gray-500 uppercase tracking-wider'>Patient</p>
              <p className='text-xs font-medium text-gray-500 uppercase tracking-wider'>Date & Time</p>
              <p className='text-xs font-medium text-gray-500 uppercase tracking-wider'>Status / Actions</p>
            </div>
            
            {/* No Results Message */}
            {filteredAppointments.length === 0 && (
              <div className='text-center py-12'>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-12 w-12 mx-auto text-gray-300" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1} 
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
                <h3 className='mt-4 text-lg font-medium text-gray-900'>No appointments found</h3>
                <p className='mt-1 text-sm text-gray-500'>
                  {searchTerm ? 'Try adjusting your search terms.' : `You don't have any ${activeTab !== 'all' ? activeTab : ''} appointments.`}
                </p>
              </div>
            )}
            
            {/* Table Rows */}
            {filteredAppointments.map((item, index) => (
              <div 
                className='flex flex-col sm:grid grid-cols-[0.5fr_2fr_1.5fr_1.5fr] gap-4 sm:gap-2 items-center py-4 px-6 border-b hover:bg-gray-50 transition-colors' 
                key={index}
              >
                {/* Index */}
                <p className='max-sm:hidden text-gray-500 font-medium'>{index + 1}</p>
                
                {/* Patient Info */}
                <div className='flex items-center gap-3 w-full sm:w-auto'>
                  <div className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-200'>
                    <span className='text-gray-600 font-medium'>
                      {item.userData.firstName?.[0] || ''}{item.userData.lastName?.[0] || ''}
                    </span>
                  </div>
                  <div className='min-w-0'>
                    <p className='text-gray-800 font-medium truncate'>
                      {item.userData.lastName}, {item.userData.firstName}
                    </p>
                    <p className='text-gray-500 text-sm truncate'>
                      {item.userData.middleName || '—'}
                    </p>
                  </div>
                </div>
                
                {/* Date and Time */}
                <div className='w-full sm:w-auto'>
                  <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'>
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                      {slotDateFormat(item.slotDate)}
                    </span>
                    <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                      {item.slotTime}
                    </span>
                  </div>
                </div>
                
                {/* Status/Actions */}
                <div className='w-full sm:w-auto flex justify-start sm:justify-end'>
                  {item.cancelled ? (
                    <span className='inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-100'>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancelled
                    </span>
                  ) : item.isCompleted ? (
                    <span className='inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-100'>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approved
                    </span>
                  ) : (
                    <div className='flex gap-3'>
                      <button
                        onClick={() => {
                          setSelectedAppointmentId(item._id);
                          setShowCancellationModal(true);
                        }}
                        className='p-2.5 hover:bg-red-50 rounded-lg transition-colors group relative'
                        title="Cancel appointment"
                      >
                        <img className='w-6 h-6' src={assets.cancel_icon} alt="Cancel" />
                        <span className='absolute inset-0 rounded-lg border-2 border-red-200 opacity-0 group-hover:opacity-100 transition-opacity'></span>
                      </button>
                      <button
                        onClick={() => completeAppointment(item._id)}
                        className='p-2.5 hover:bg-green-50 rounded-lg transition-colors group relative'
                        title="Approve appointment"
                      >
                        <img className='w-6 h-6' src={assets.tick_icon} alt="Complete" />
                        <span className='absolute inset-0 rounded-lg border-2 border-green-200 opacity-0 group-hover:opacity-100 transition-opacity'></span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Cancellation Modal */}
        <CancellationModal 
          isOpen={showCancellationModal}
          onClose={() => {
            setShowCancellationModal(false);
            setSelectedAppointmentId(null);
          }}
          onConfirm={(reason) => {
            if (selectedAppointmentId) {
              cancelAppointment(selectedAppointmentId, reason);
              setShowCancellationModal(false);
              setSelectedAppointmentId(null);
            }
          }}
          title="Cancel Appointment"
        />
      </div>
    </div>
  )
}

export default DoctorAppointments