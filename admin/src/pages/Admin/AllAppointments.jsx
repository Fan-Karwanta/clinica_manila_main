import React, { useEffect, useState, useCallback, useRef } from 'react'
import { assets } from '../../assets/assets'
import { useContext } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import CancellationModal from '../../components/CancellationModal'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const AllAppointments = () => {
  console.log('Rendering AllAppointments component')

  const { aToken, appointments, cancelAppointment, getAllAppointments, doctors } = useContext(AdminContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  
  // State for filters and filtered results
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [dateFilter, setDateFilter] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [uniqueSpecialties, setUniqueSpecialties] = useState([])
  // Debug mode to show extra information
  const [showDebugInfo, setShowDebugInfo] = useState(true)
  
  // State for cancellation modal
  const [showCancellationModal, setShowCancellationModal] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null)
  
  // State for search and PDF export
  const [searchTerm, setSearchTerm] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const tableRef = useRef(null)

  // Extract all available specialties when appointments load
  useEffect(() => {
    if (appointments.length > 0) {
      // Create an array of all unique specialties from appointments
      const allSpecialties = Array.from(new Set(
        appointments
          .filter(item => item.docData) // Ensure docData exists
          .map(item => {
            // Try both possible spellings (speciality and specialty)
            return item.docData.speciality || item.docData.specialty || ''
          })
          .filter(Boolean) // Remove empty values
      ));
      
      setUniqueSpecialties(allSpecialties);
      
      // Debug: Log all appointment dates to understand what we're working with
      console.log('======= All Appointment Dates =======')
      appointments.forEach((app, i) => {
        if (i < 10) { // Just log the first 10 to avoid overwhelming logs
          console.log(`${i+1}. slotDate = "${app.slotDate}" (type: ${typeof app.slotDate})`)
        }
      });
    }
  }, [appointments])
  
  // Helper function - converts dates from input format to database format
  const convertToDbFormat = useCallback((inputDate) => {
    if (!inputDate) return null;
    
    try {
      // Input is YYYY-MM-DD from the date picker
      const [year, month, day] = inputDate.split('-');
      
      // Database format is DD_MM_YYYY with zero padding
      return `${day.padStart(2, '0')}_${month.padStart(2, '0')}_${year}`;
    } catch (error) {
      console.error('Error converting date format:', error);
      return null;
    }
  }, [])
  
  // Log when filters change for debugging
  useEffect(() => {
    if (dateFilter) {
      const dbFormat = convertToDbFormat(dateFilter);
      console.log(`Date filter changed: ${dateFilter} => ${dbFormat}`);
    }
  }, [dateFilter, convertToDbFormat])
  
  useEffect(() => {
    if (specialtyFilter) {
      console.log(`Specialty filter changed: ${specialtyFilter}`);
    }
  }, [specialtyFilter])

  // Load appointments when the component mounts
  useEffect(() => {
    if (aToken) {
      getAllAppointments();
      console.log('Loading all appointments...');
    }
  }, [aToken, getAllAppointments])
  
  // FIXED FILTER LOGIC TO MATCH ACTUAL DATABASE FORMAT
  useEffect(() => {
    // Skip if no appointments loaded
    if (!appointments || appointments.length === 0) {
      console.log('No appointments to filter');
      return;
    }
    
    // Start with all appointments
    let results = [...appointments];
    console.log(`FILTERING: Starting with ${results.length} total appointments`);
    
    // ===== VISUAL DEBUGGING =====
    // Display appointment dates for the first 5 appointments
    console.log('SAMPLE DATABASE DATES:');
    appointments.slice(0, 5).forEach((app, i) => {
      console.log(`Appointment ${i+1}: "${app.slotDate}" - format: D_M_YYYY (no zero padding)`);
    });
    
    // FILTER BY DATE
    if (dateFilter) {
      // Get the input date components (YYYY-MM-DD)
      const dateParts = dateFilter.split('-');
      
      if (dateParts.length === 3) {
        const year = dateParts[0];
        const month = parseInt(dateParts[1], 10).toString(); // Convert "01" to "1"
        const day = parseInt(dateParts[2], 10).toString(); // Convert "01" to "1"
        
        // Create the search date in EXACT database format (D_M_YYYY without zero padding)
        const searchDate = `${day}_${month}_${year}`;
        console.log(`\n=== DATE FILTER CONVERSION ===`);
        console.log(`Input date: ${dateFilter} (YYYY-MM-DD)`); 
        console.log(`Converted to: "${searchDate}" (D_M_YYYY without zero padding)`);
        
        // Apply the string comparison filter
        console.log(`Filtering: looking for slotDate === "${searchDate}"`);
        
        const beforeCount = results.length;
        results = results.filter(appointment => appointment.slotDate === searchDate);
        
        // Show detailed results
        console.log(`DATE FILTER RESULTS: ${results.length} of ${beforeCount} match`);
        
        // If zero results, show more debug info
        if (results.length === 0) {
          console.log('\n❌ NO DATE MATCHES - Debug information:');
          console.log('This means none of the appointments have the exact date string:');
          console.log(`"${searchDate}"`);
          console.log('Sample appointment dates in database:');
          appointments.slice(0, 5).forEach((app, i) => {
            console.log(`${i+1}: "${app.slotDate}"`);
          });
        } else {
          console.log('\n✅ MATCHES FOUND:');
          results.slice(0, 3).forEach((app, i) => {
            console.log(`Match ${i+1}: ID ${app._id}, Date: "${app.slotDate}"`);
          });
        }
      }
    }
    
    // FILTER BY SPECIALTY
    if (specialtyFilter) {
      console.log(`\nApplying specialty filter: "${specialtyFilter}"`);
      
      const beforeCount = results.length;
      results = results.filter(appt => {
        // Handle both possible spellings of speciality/specialty
        const docSpecialty = appt.docData?.speciality || appt.docData?.specialty || '';
        return docSpecialty === specialtyFilter;
      });
      
      console.log(`SPECIALTY FILTER: ${results.length} of ${beforeCount} appointments match`);
    }
    
    // FILTER BY SEARCH TERM
    if (searchTerm.trim() !== '') {
      console.log(`\nApplying search term: "${searchTerm}"`);
      
      const searchLower = searchTerm.toLowerCase();
      const beforeCount = results.length;
      
      results = results.filter(appt => {
        // Search in patient name
        const patientName = `${appt.userData.lastName} ${appt.userData.firstName} ${appt.userData.middleName || ''}`.toLowerCase();
        
        // Search in doctor name
        const doctorName = (appt.docData?.name || '').toLowerCase();
        
        // Search in date and time
        const date = slotDateFormat(appt.slotDate).toLowerCase();
        const time = (appt.slotTime || '').toLowerCase();
        
        return patientName.includes(searchLower) || 
               doctorName.includes(searchLower) || 
               date.includes(searchLower) || 
               time.includes(searchLower);
      });
      
      console.log(`SEARCH TERM FILTER: ${results.length} of ${beforeCount} appointments match`);
    }
    
    // Update the filtered results
    setFilteredAppointments(results);
  }, [appointments, dateFilter, specialtyFilter, searchTerm, slotDateFormat])

  // Function to export the current table to PDF
  const exportToPDF = async () => {
    if (!tableRef.current) return;
    
    setExportLoading(true);
    try {
      // Get the appointments to export (filtered or all)
      const appointmentsToExport = dateFilter || specialtyFilter || searchTerm ? filteredAppointments : appointments;
      
      // Initialize PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      
      // Add title to first page
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('All Appointments Report', pageWidth / 2, margin + 10, { align: 'center' });
      
      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, margin + 18, { align: 'center' });
      
      // Add filter information
      let filterText = 'Filter: ';
      if (dateFilter) filterText += `Date: ${slotDateFormat(convertToDbFormat(dateFilter))} | `;
      if (specialtyFilter) filterText += `Specialty: ${specialtyFilter} | `;
      if (searchTerm) filterText += `Search: "${searchTerm}" | `;
      
      if (filterText === 'Filter: ') filterText += 'All Appointments';
      else filterText = filterText.slice(0, -3); // Remove the last " | "
      
      pdf.setFontSize(10);
      pdf.text(filterText, pageWidth / 2, margin + 25, { align: 'center' });
      
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
          { text: 'DATE & TIME', width: 20, align: 'left' },
          { text: 'DOCTOR', width: 25, align: 'left' },
          { text: 'STATUS', width: 20, align: 'center' }
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
          { width: 20, align: 'left' }, // Date & Time
          { width: 25, align: 'left' }, // Doctor
          { width: 20, align: 'center' } // Status
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
          pdf.text(item.userData.middleName, xPos + 2, rowStartY + 8);
        }
        xPos += colWidth;
        
        // Draw date and time
        colWidth = (contentWidth * columns[2].width) / 100;
        pdf.setFont('helvetica', 'normal');
        const formattedDate = slotDateFormat(item.slotDate);
        pdf.text(formattedDate, xPos + 2, rowStartY + 4);
        pdf.text(item.slotTime, xPos + 2, rowStartY + 8);
        xPos += colWidth;
        
        // Draw doctor info
        colWidth = (contentWidth * columns[3].width) / 100;
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.docData.name || 'Unknown', xPos + 2, rowStartY + 4);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.text(item.docData.speciality || item.docData.specialty || 'General', xPos + 2, rowStartY + 8);
        pdf.setFontSize(8);
        xPos += colWidth;
        
        // Draw status with colored background
        colWidth = (contentWidth * columns[4].width) / 100;
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
      pdf.save(`all-appointments-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className='w-full max-w-6xl m-5 '>

      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-3'>
        <div className='flex items-center gap-2'>
          <p className='text-lg font-medium'>All Appointments</p>
          {showDebugInfo && (
            <div className='text-xs bg-yellow-100 px-2 py-1 rounded flex items-center'>
              <span className='font-bold mr-1'>Count:</span> {appointments.length} appointments
            </div>
          )}
        </div>
        
        <div className='flex flex-col sm:flex-row gap-3 w-full sm:w-auto'>
          {/* Search Box */}
          <div className='relative w-full sm:w-64'>
            <input
              type='text'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder='Search appointments...'
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
            />
            <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Export Button */}
          <button
            onClick={exportToPDF}
            disabled={exportLoading || appointments.length === 0}
            className={`flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium ${
              exportLoading || appointments.length === 0
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            Export to PDF
          </button>
        </div>
        
        <div className='flex gap-4'>
          {/* Date Filter */}
          <div className='flex items-center gap-2'>
            <label htmlFor='date-filter' className='text-sm'>Date:</label>
            <input
              type='date'
              id='date-filter'
              value={dateFilter || ''} 
              onChange={(e) => {
                // Get the selected date from the date picker
                const newDate = e.target.value;
                
                if (newDate) {
                  // Show the exact conversion that will happen
                  const [year, month, day] = newDate.split('-');
                  // Convert month/day from "01" to "1" by parsing and converting back to string
                  const monthNoZero = parseInt(month, 10).toString();
                  const dayNoZero = parseInt(day, 10).toString();
                  const searchDate = `${dayNoZero}_${monthNoZero}_${year}`;
                  
                  console.log(`DATE PICKED: ${newDate} (YYYY-MM-DD)`);
                  console.log(`Will search for: "${searchDate}" (D_M_YYYY without zero padding)`);
                } else {
                  console.log('Date filter cleared');
                }
                
                // Update the filter state
                setDateFilter(newDate);
              }}
              className='border rounded p-1 text-sm'
            />
            {dateFilter && (
              <button 
                onClick={() => {
                  // Clear the date filter and reset the filtered results
                  setDateFilter('');
                  setFilteredAppointments([]);
                  console.log('Date filter cleared');
                }}
                className='text-xs text-red-500'
              >
                Clear
              </button>
            )}
          </div>

          {/* Specialty Filter */}
          <div className='flex items-center gap-2'>
            <label htmlFor='specialty-filter' className='text-sm'>Specialty:</label>
            <select
              id='specialty-filter'
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className='border rounded p-1 text-sm'
            >
              <option value=''>All Specialties</option>
              {uniqueSpecialties.length > 0 ? (
                uniqueSpecialties.map((specialty, index) => (
                  <option key={index} value={specialty}>{specialty}</option>
                ))
              ) : (
                <option value="" disabled>No specialties found</option>
              )}
            </select>
            {specialtyFilter && (
              <button 
                onClick={() => setSpecialtyFilter('')}
                className='text-xs text-red-500'
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll' ref={tableRef}>
        <div className='hidden sm:grid grid-cols-[0.5fr_2fr_2fr_2fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
          <p>#</p>
          <p>Full Name (LN, FN, MN)</p>
          {/*<p>Age</p>*/}
          <p>Date & Time</p>
          <p>Doctor</p>
          {/*<p>Fees</p>*/}
          <p>Action</p>
        </div>
        {/* Show filtered appointments when filters are applied, otherwise show all appointments */}
        {/* Show filtered appointments when filters are applied, otherwise show all */}
            {(dateFilter || specialtyFilter || searchTerm ? filteredAppointments : appointments).map((item, index) => (
          <div className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_2fr_2fr_2fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
            <p className='max-sm:hidden'>{index+1}</p>
            <div className='flex items-center gap-2'>
             {/* <img src={item.userData.image} className='w-8 rounded-full' alt="" />*/} <p>{item.userData.lastName}, {item.userData.firstName}, {item.userData.middleName}</p>
            </div>
           {/* <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p> */}
            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            <div className='flex items-center gap-4'>
              <img src={item.docData.image} className='w-8 rounded-full bg-gray-200' alt="" /> <p>{item.docData.name}</p>
            </div>
            {/*<p>{currency}{item.amount}</p>*/}
            {item.cancelled ? (
                <p className='text-red-400 text-xs font-medium'>
                  Cancelled
                  {item.cancellationReason && (
                    <span className="block mt-1 text-gray-500">
                      Reason: {item.cancellationReason}
                    </span>
                  )}
                </p>
              ) : item.isCompleted ? (
                <p className='text-green-500 text-xs font-medium'>Approved</p>
              ) : (
                <img 
                  onClick={() => {
                    setSelectedAppointmentId(item._id);
                    setShowCancellationModal(true);
                  }} 
                  className='w-10 cursor-pointer' 
                  src={assets.cancel_icon} 
                  alt="Cancel appointment" 
                  title="Cancel appointment"
                />
              )}
          </div>
        ))}
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
  )
}

export default AllAppointments