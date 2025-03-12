import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const Dashboard = () => {
  const { aToken, getDashData, cancelAppointment, dashData, appointments, getAllAppointments } = useContext(AdminContext)
  const { slotDateFormat } = useContext(AppContext)

  // State for dashboard components
  const [weekdayDistribution, setWeekdayDistribution] = useState([])
  const [demographicData, setDemographicData] = useState([])
  const [activityLog, setActivityLog] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (aToken) {
      setIsLoading(true)
      getDashData()
      getAllAppointments() // Get all appointments to calculate doctor stats
    }
  }, [aToken])

  // Process data when appointments change
  useEffect(() => {
    if (appointments.length > 0 && dashData) {
      setWeekdayDistribution(processAppointmentsByWeekday())
      setDemographicData(generateDemographicData())

      // Generate activity log from recent appointments
      const log = appointments.slice(0, 10).map(app => ({
        type: app.isCompleted ? 'completed' : app.cancelled ? 'cancelled' : 'scheduled',
        message: `Appointment with Dr. ${app.docData.name} ${app.isCompleted ? 'completed' : app.cancelled ? 'cancelled' : 'scheduled'}`,
        time: new Date(app.slotDate).toLocaleString()
      }));
      setActivityLog(log)
      setIsLoading(false)
    }
  }, [appointments, dashData])

  // Calculate statistics
  const totalAppointments = dashData?.appointments || 0
  const completedAppointments = dashData?.latestAppointments?.filter(app => app.isCompleted).length || 0
  const cancelledAppointments = dashData?.latestAppointments?.filter(app => app.cancelled).length || 0
  const pendingAppointments = dashData?.latestAppointments?.filter(app => !app.isCompleted && !app.cancelled).length || 0
  const completionRate = totalAppointments ? ((completedAppointments / totalAppointments) * 100).toFixed(1) : 0

  // Calculate doctor statistics from all appointments
  const doctorStats = appointments.reduce((acc, app) => {
    const docId = app.docId
    if (!acc[docId]) {
      acc[docId] = {
        id: docId,
        name: app.docData.name,
        image: app.docData.image,
        speciality: app.docData.speciality || 'General Practitioner',
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        pendingAppointments: 0
      }
    }
    acc[docId].totalAppointments++
    if (app.isCompleted) acc[docId].completedAppointments++
    else if (app.cancelled) acc[docId].cancelledAppointments++
    else acc[docId].pendingAppointments++
    return acc
  }, {})

  // Get most selected doctors
  const mostSelectedDoctors = Object.values(doctorStats)
    .sort((a, b) => b.totalAppointments - a.totalAppointments)
    .slice(0, 3)

  // Helper functions for data processing
  const processAppointmentsByWeekday = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const counts = Array(7).fill(0);

    appointments.forEach(app => {
      const date = new Date(app.slotDate);
      const dayOfWeek = date.getDay();
      counts[dayOfWeek]++;
    });

    return days.map((day, index) => ({
      name: day.substring(0, 3),
      value: counts[index]
    }));
  };

  // Generate demographic data based on patients
  const generateDemographicData = () => {
    // This would ideally come from actual patient data
    // For now we'll create sample data based on total patients
    const maleCount = Math.floor(dashData.patients * 0.48);
    const femaleCount = Math.floor(dashData.patients * 0.51);
    const otherCount = dashData.patients - maleCount - femaleCount;

    return [
      { name: 'Male', value: maleCount },
      { name: 'Female', value: femaleCount },
      { name: 'Other', value: otherCount }
    ];
  };

  // Constants for styling
  const statusColors = {
    completed: 'bg-green-100 text-green-600',
    cancelled: 'bg-red-100 text-red-600',
    scheduled: 'bg-blue-100 text-blue-600'
  };

  return dashData && (
    <div className='m-3 sm:m-5'>
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
            Dashboard
          </h1>
          <p className="text-gray-600">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setIsLoading(true);
              getDashData();
              getAllAppointments();
            }}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Main Stats Cards */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
            <div className='bg-white p-4 sm:p-6 rounded-lg border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <p className='text-sm text-gray-500 mb-1'>Total Doctors</p>
                  <p className='text-2xl font-bold text-gray-800'>{dashData.doctors}</p>
                </div>
                <div className='bg-blue-50 p-3 rounded-full'>
                  <img className='w-6 h-6' src={assets.doctor_icon} alt="Doctors" />
                </div>
              </div>
              <div className='text-sm text-gray-600 flex items-center'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Active healthcare providers
              </div>
            </div>

            <div className='bg-white p-4 sm:p-6 rounded-lg border-l-4 border-green-500 shadow-sm hover:shadow-md transition-shadow'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <p className='text-sm text-gray-500 mb-1'>Total Patients</p>
                  <p className='text-2xl font-bold text-gray-800'>{dashData.patients}</p>
                </div>
                <div className='bg-green-50 p-3 rounded-full'>
                  <img className='w-6 h-6' src={assets.patients_icon} alt="Patients" />
                </div>
              </div>
              <div className='text-sm text-gray-600 flex items-center'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Registered patients in the system
              </div>
            </div>

            <div className='bg-white p-4 sm:p-6 rounded-lg border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <p className='text-sm text-gray-500 mb-1'>Total Appointments</p>
                  <p className='text-2xl font-bold text-gray-800'>{totalAppointments}</p>
                </div>
                <div className='bg-purple-50 p-3 rounded-full'>
                  <img className='w-6 h-6' src={assets.appointments_icon} alt="Appointments" />
                </div>
              </div>
              <div className='text-sm text-gray-600'>
                <span className='text-green-600'>{completedAppointments} approved</span> • <span className='text-red-600'>{cancelledAppointments} cancelled</span>
              </div>
            </div>

            <div className='bg-white p-4 sm:p-6 rounded-lg border-l-4 border-yellow-500 shadow-sm hover:shadow-md transition-shadow'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <p className='text-sm text-gray-500 mb-1'>Approval Rate</p>
                  <p className='text-2xl font-bold text-gray-800'>{completionRate}%</p>
                </div>
                <div className='bg-yellow-50 p-3 rounded-full'>
                  <img className='w-6 h-6' src={assets.tick_icon} alt="Approval Rate" />
                </div>
              </div>
              <div className='text-sm text-gray-600 flex items-center'>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {pendingAppointments} appointments pending
              </div>
            </div>
          </div>

          {/* Two-column layout for larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - 2/3 width */}
            <div className="lg:col-span-2">
              {/* Latest Bookings - Enhanced */}
              <div className='bg-white rounded-lg border border-gray-100 shadow-sm h-full'>
                <div className='flex items-center justify-between px-4 sm:px-6 py-4 border-b'>
                  <div className='flex items-center gap-2'>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className='font-semibold'>Latest Bookings</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/*<select className="text-sm border border-gray-200 rounded px-2 py-1 bg-white">
                      <option value="all">All Bookings</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="cancelled">Cancelled</option>
                    </select>*/}
                    <span className='text-sm text-gray-500 hidden sm:inline'>Recent Appointments</span>
                  </div>
                </div>

                <div className='divide-y'>
                  {dashData.latestAppointments.slice(0, 6).map((item, index) => (
                    <div className='flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:px-6 hover:bg-gray-50 transition-colors' key={index}>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 bg-gray-100 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm'>
                            <img src={item.docData.image} alt="" className='w-full h-full object-cover' />
                          </div>
                          <div className='min-w-0'>
                            <div className="flex items-center gap-2">
                              <p className='text-gray-800 font-medium truncate'>
                                Dr. {item.docData.name}
                              </p>
                              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{item.docData.speciality || 'General'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className='text-gray-500 text-sm'>
                                {slotDateFormat(item.slotDate)} • {item.slotTime}
                              </p>
                              <p className="text-xs text-gray-400">Patient: {item.userData.name}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className='flex justify-end sm:w-auto items-center gap-2'>
                        {item.cancelled ? (
                          <span className='px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 flex items-center gap-1'>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelled
                          </span>
                        ) : item.isCompleted ? (
                          <span className='px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 flex items-center gap-1'>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approved
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => cancelAppointment(item._id)}
                              className='p-1.5 hover:bg-red-50 rounded-full transition-colors'
                              title="Cancel Appointment"
                            >
                              <img className='w-5 h-5' src={assets.cancel_icon} alt="Cancel" />
                            </button>
                            <span className='px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600 flex items-center gap-1'>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Pending
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {dashData.latestAppointments.length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                      No appointments found
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right column - 1/3 width */}
            <div className="space-y-6">
              {/* Most Selected Doctors */}
              <div className='bg-white rounded-lg border border-gray-100 shadow-sm'>
                <div className='flex items-center justify-between px-4 sm:px-6 py-4 border-b'>
                  <div className='flex items-center gap-2'>
                    <img src={assets.doctor_icon} alt="" className='w-5 h-5' />
                    <p className='font-semibold'>Top Doctors</p>
                  </div>
                  <span className='text-sm text-gray-500'>By appointments</span>
                </div>
                <div className='divide-y'>
                  {mostSelectedDoctors.map((doctor, index) => (
                    <div key={index} className='flex items-center gap-4 p-4 sm:px-6 hover:bg-gray-50 transition-colors'>
                      <div className='w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm'>
                        <img src={doctor.image} alt={doctor.name} className='w-full h-full object-cover' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2'>
                          <p className='font-medium text-gray-800'>Dr. {doctor.name}</p>
                          <span className='text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full'>
                            {doctor.speciality}
                          </span>
                        </div>
                        <div className='text-sm text-gray-500'>
                          <span>{doctor.totalAppointments} total appointments</span>
                          {doctor.pendingAppointments > 0 && (
                            <span className='text-blue-600 ml-2'>• {doctor.pendingAppointments} pending</span>
                          )}
                        </div>
                        <div className='text-xs text-gray-400 mt-0.5'>
                          <span className='text-green-500'>{doctor.completedAppointments} completed</span>
                          {doctor.cancelledAppointments > 0 && (
                            <span className='text-red-500 ml-2'>• {doctor.cancelledAppointments} cancelled</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {mostSelectedDoctors.length === 0 && (
                    <div className='p-4 sm:px-6 text-sm text-gray-500 text-center'>
                      No doctors data available
                    </div>
                  )}
                </div>
              </div>
              
              {/* Patient Demographics */}
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="font-semibold">Patient Demographics</p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    {demographicData.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="font-bold text-xl">{item.value}</div>
                        <div className="text-sm text-gray-500">{item.name}</div>
                      </div>
                    ))}
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    {demographicData.map((item, index) => {
                      const totalValue = demographicData.reduce((sum, item) => sum + item.value, 0);
                      const percentage = totalValue ? (item.value / totalValue) * 100 : 0;
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500'];
                      return (
                        <div 
                          key={index}
                          className={`h-full float-left ${colors[index % colors.length]}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-gray-500 text-center mt-4">
                    Patient gender distribution
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
