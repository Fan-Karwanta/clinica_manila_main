import React, { useEffect, useState, useCallback } from 'react'
import { assets } from '../../assets/assets'
import { useContext } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import CancellationModal from '../../components/CancellationModal'

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
  
  // This was a duplicate useEffect, removing it to avoid conflicts
  


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
    
    // Update the filtered results
    setFilteredAppointments(results);
  }, [appointments, dateFilter, specialtyFilter])

  return (
    <div className='w-full max-w-6xl m-5 '>

      <div className='flex justify-between items-center mb-3'>
        <div className='flex items-center gap-2'>
          <p className='text-lg font-medium'>All Appointments</p>
          {showDebugInfo && (
            <div className='text-xs bg-yellow-100 px-2 py-1 rounded flex items-center'>
              <span className='font-bold mr-1'>Count:</span> {appointments.length} appointments
            </div>
          )}
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

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
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
            {(dateFilter || specialtyFilter ? filteredAppointments : appointments).map((item, index) => (
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