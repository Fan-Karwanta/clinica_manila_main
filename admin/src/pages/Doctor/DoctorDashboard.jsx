import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const DoctorDashboard = () => {
  const { dToken, dashData, getDashData, cancelAppointment, completeAppointment, profileData, getProfileData } = useContext(DoctorContext)
  const { slotDateFormat } = useContext(AppContext)
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    if (dToken) {
      getDashData()
      getProfileData()
    }
  }, [dToken])

  // Get all upcoming appointments (not cancelled, including both pending and approved)
  const upcomingAppointments = dashData.latestAppointments
    .filter(app => !app.cancelled) // Only filter out cancelled appointments
    .sort((a, b) => {
      // Convert dates and times to comparable values
      const [dayA, monthA, yearA] = a.slotDate.split('_').map(Number)
      const [dayB, monthB, yearB] = b.slotDate.split('_').map(Number)
      
      // Create date objects with times
      const [timeA, periodA] = a.slotTime.split(' ')
      const [hoursA, minutesA] = timeA.split(':').map(Number)
      let dateA = new Date(yearA, monthA - 1, dayA)
      dateA.setHours(
        periodA === 'PM' && hoursA !== 12 ? hoursA + 12 : (periodA === 'AM' && hoursA === 12 ? 0 : hoursA),
        minutesA
      )

      const [timeB, periodB] = b.slotTime.split(' ')
      const [hoursB, minutesB] = timeB.split(':').map(Number)
      let dateB = new Date(yearB, monthB - 1, dayB)
      dateB.setHours(
        periodB === 'PM' && hoursB !== 12 ? hoursB + 12 : (periodB === 'AM' && hoursB === 12 ? 0 : hoursB),
        minutesB
      )

      return dateA - dateB
    })

  // Find next appointment (first upcoming appointment)
  const now = new Date()
  const nextAppointment = upcomingAppointments.find(app => {
    const [day, month, year] = app.slotDate.split('_').map(Number)
    const [time, period] = app.slotTime.split(' ')
    const [hours, minutes] = time.split(':').map(Number)
    
    const appointmentDate = new Date(year, month - 1, day)
    appointmentDate.setHours(
      period === 'PM' && hours !== 12 ? hours + 12 : (period === 'AM' && hours === 12 ? 0 : hours),
      minutes
    )
    
    return appointmentDate > now
  })

  // Calculate completion rate
  const completedAppointments = dashData.latestAppointments.filter(app => app.isCompleted).length
  const totalValidAppointments = dashData.latestAppointments.filter(app => !app.cancelled).length || 1
  const completionRate = ((completedAppointments / totalValidAppointments) * 100).toFixed(1)

  // Calculate pending appointments
  const pendingAppointments = dashData.latestAppointments.filter(app => !app.isCompleted && !app.cancelled).length

  // Get cancelled appointments
  const cancelledAppointments = dashData.latestAppointments.filter(app => app.cancelled).length

  // Filter appointments based on active tab
  const filteredAppointments = dashData.latestAppointments.filter(app => {
    if (activeTab === 'upcoming') return !app.cancelled && !app.isCompleted;
    if (activeTab === 'approved') return !app.cancelled && app.isCompleted;
    if (activeTab === 'cancelled') return app.cancelled;
    return true; // 'all' tab
  });

  return (
    <div className='bg-gray-50 min-h-screen p-4 sm:p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Welcome Message with Quick Status */}
        <div className='bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <h1 className='text-2xl sm:text-3xl font-bold text-gray-800 mb-2'>
                Welcome back, Dr. {profileData?.name || 'Doctor'}
              </h1>
              <p className='text-gray-600'>Here's what's happening with your appointments.</p>
            </div>
            <div className='flex items-center'>
              <div className={`w-3 h-3 rounded-full ${profileData?.available ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
              <span className='text-sm font-medium'>
                Status: {profileData?.available ? 'Available for Appointments' : 'Not Available'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
          {/* Next Appointment Card */}
          <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <p className='text-sm font-medium text-gray-500'>Next Appointment</p>
                <p className='text-2xl font-bold text-gray-800 mt-1'>{nextAppointment ? '1' : '0'}</p>
              </div>
              <div className='bg-blue-100 p-3 rounded-full'>
                <img className='w-7 h-7' src={assets.appointments_icon} alt="" />
              </div>
            </div>
            {nextAppointment && (
              <div className='bg-blue-50 p-3 rounded-lg'>
                <p className='text-gray-800 font-medium'>{slotDateFormat(nextAppointment.slotDate)}</p>
                <p className='text-gray-600 font-medium mt-1 flex items-center'>
                  <span className='bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2'>{nextAppointment.slotTime}</span>
                  <span className='truncate'>{nextAppointment.userData?.firstName} {nextAppointment.userData?.lastName}</span>
                </p>
              </div>
            )}
          </div>

          {/* Total Patients Card */}
          <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <p className='text-sm font-medium text-gray-500'>Total Patients</p>
                <p className='text-2xl font-bold text-gray-800 mt-1'>{dashData.patients}</p>
              </div>
              <div className='bg-green-100 p-3 rounded-full'>
                <img className='w-7 h-7' src={assets.patients_icon} alt="" />
              </div>
            </div>
            <div className='flex items-center justify-between'>
              <div className='text-sm text-gray-600'>
                <span className='font-medium'>Lifetime appointments:</span> {dashData.appointments}
              </div>
              <div className='text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full'>
                {dashData.patients ? '+' + Math.min(100, dashData.patients) + '%' : '0%'}
              </div>
            </div>
          </div>

          {/* Approval Rate Card */}
          <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <p className='text-sm font-medium text-gray-500'>Approval Rate</p>
                <p className='text-2xl font-bold text-gray-800 mt-1'>{completionRate}%</p>
              </div>
              <div className='bg-purple-100 p-3 rounded-full'>
                <img className='w-7 h-7' src={assets.tick_icon} alt="" />
              </div>
            </div>
            <div className='relative pt-1'>
              <div className='flex mb-2 items-center justify-between'>
                <div>
                  <span className='text-xs font-medium text-purple-800 bg-purple-100 px-2 py-1 rounded-full'>
                    {completedAppointments} approved
                  </span>
                </div>
                <div className='text-right'>
                  <span className='text-xs font-medium text-gray-500'>of {totalValidAppointments} total</span>
                </div>
              </div>
              <div className='overflow-hidden h-2 text-xs flex rounded bg-gray-200'>
                <div style={{ width: `${completionRate}%` }} className='shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-purple-500'></div>
              </div>
            </div>
          </div>

          {/* Pending Actions Card */}
          <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <p className='text-sm font-medium text-gray-500'>Pending Actions</p>
                <p className='text-2xl font-bold text-gray-800 mt-1'>{pendingAppointments}</p>
              </div>
              <div className='bg-yellow-100 p-3 rounded-full'>
                <img className='w-7 h-7' src={assets.list_icon} alt="" />
              </div>
            </div>
            <div className='flex justify-between items-center'>
              <p className='text-sm text-gray-600'>Requires your review</p>
              {pendingAppointments > 0 && (
                <span className='inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                  Action needed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Appointments with Tabs */}
        <div className='bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8'>
          <div className='border-b border-gray-200'>
            <nav className='flex flex-wrap'>
              <button 
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'upcoming' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upcoming
              </button>
              <button 
                onClick={() => setActiveTab('approved')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'approved' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Approved
              </button>
              <button 
                onClick={() => setActiveTab('cancelled')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'cancelled' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Cancelled
              </button>
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'all' 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Appointments
              </button>
            </nav>
          </div>

          {/* Appointment List */}
          <div>
            {filteredAppointments.length === 0 ? (
              <div className='p-6 text-center'>
                <div className='inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4'>
                  <img src={assets.appointments_icon} alt="" className='w-8 h-8 opacity-50' />
                </div>
                <h3 className='text-lg font-medium text-gray-900'>No appointments found</h3>
                <p className='mt-1 text-sm text-gray-500'>
                  {activeTab === 'upcoming' && "You don't have any upcoming appointments."}
                  {activeTab === 'approved' && "You don't have any approved appointments."}
                  {activeTab === 'cancelled' && "You don't have any cancelled appointments."}
                  {activeTab === 'all' && "You don't have any appointments yet."}
                </p>
              </div>
            ) : (
              <div className='divide-y divide-gray-200'>
                {filteredAppointments.map((item, index) => (
                  <div 
                    className='flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-gray-50 transition-colors' 
                    key={index}
                  >
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-3'>
                        <div className='w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-200'>
                          <span className='text-gray-600 font-medium'>
                            {item.userData?.firstName?.[0] || ''}{item.userData?.lastName?.[0] || ''}
                          </span>
                        </div>
                        <div className='min-w-0'>
                          <p className='text-gray-800 font-medium truncate'>
                            {item.userData?.lastName || ''}, {item.userData?.firstName || ''}
                          </p>
                          <div className='flex items-center gap-2 mt-1'>
                            <span className='text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded'>
                              {slotDateFormat(item.slotDate)}
                            </span>
                            <span className='text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded'>
                              {item.slotTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className='flex justify-end sm:w-auto'>
                      {item.cancelled ? (
                        <span className='px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100'>
                          Cancelled
                        </span>
                      ) : item.isCompleted ? (
                        <span className='px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-100'>
                          Approved
                        </span>
                      ) : (
                        <div className='flex gap-3'>
                          <button
                            onClick={() => cancelAppointment(item._id)}
                            className='p-2.5 hover:bg-red-50 rounded-lg transition-colors group relative'
                            title="Cancel appointment"
                          >
                            <img className='w-7 h-7' src={assets.cancel_icon} alt="Cancel" />
                            <span className='absolute inset-0 rounded-lg border-2 border-red-200 opacity-0 group-hover:opacity-100 transition-opacity'></span>
                          </button>
                          <button
                            onClick={() => completeAppointment(item._id)}
                            className='p-2.5 hover:bg-green-50 rounded-lg transition-colors group relative'
                            title="Approve appointment"
                          >
                            <img className='w-7 h-7' src={assets.tick_icon} alt="Complete" />
                            <span className='absolute inset-0 rounded-lg border-2 border-green-200 opacity-0 group-hover:opacity-100 transition-opacity'></span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Appointment Statistics Summary */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          {/* Appointment Status Overview */}
          <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm lg:col-span-2'>
            <h3 className='text-lg font-medium text-gray-800 mb-4'>Appointment Overview</h3>
            <div className='grid grid-cols-3 gap-4 mb-4'>
              <div className='bg-blue-50 rounded-lg p-4 text-center'>
                <div className='text-2xl font-bold text-blue-700 mb-1'>{pendingAppointments}</div>
                <div className='text-sm text-blue-800'>Pending</div>
              </div>
              <div className='bg-green-50 rounded-lg p-4 text-center'>
                <div className='text-2xl font-bold text-green-700 mb-1'>{completedAppointments}</div>
                <div className='text-sm text-green-800'>Approved</div>
              </div>
              <div className='bg-red-50 rounded-lg p-4 text-center'>
                <div className='text-2xl font-bold text-red-700 mb-1'>{cancelledAppointments}</div>
                <div className='text-sm text-red-800'>Cancelled</div>
              </div>
            </div>
            <div className='bg-gray-50 p-4 rounded-lg'>
              <div className='flex justify-between items-center mb-2'>
                <span className='text-sm font-medium text-gray-700'>Total Appointments</span>
                <span className='font-medium'>{dashData.latestAppointments.length}</span>
              </div>
              <div className='h-6 bg-gray-200 rounded-full overflow-hidden'>
                <div className='flex h-full'>
                  {pendingAppointments > 0 && (
                    <div 
                      className='bg-blue-500 h-full' 
                      style={{ width: `${(pendingAppointments / dashData.latestAppointments.length) * 100}%` }}
                      title={`Pending: ${pendingAppointments}`}
                    ></div>
                  )}
                  {completedAppointments > 0 && (
                    <div 
                      className='bg-green-500 h-full' 
                      style={{ width: `${(completedAppointments / dashData.latestAppointments.length) * 100}%` }}
                      title={`Approved: ${completedAppointments}`}
                    ></div>
                  )}
                  {cancelledAppointments > 0 && (
                    <div 
                      className='bg-red-500 h-full' 
                      style={{ width: `${(cancelledAppointments / dashData.latestAppointments.length) * 100}%` }}
                      title={`Cancelled: ${cancelledAppointments}`}
                    ></div>
                  )}
                </div>
              </div>
              <div className='flex justify-between text-xs mt-2'>
                <div className='flex items-center'>
                  <div className='w-3 h-3 bg-blue-500 rounded-full mr-1'></div>
                  <span>Pending</span>
                </div>
                <div className='flex items-center'>
                  <div className='w-3 h-3 bg-green-500 rounded-full mr-1'></div>
                  <span>Approved</span>
                </div>
                <div className='flex items-center'>
                  <div className='w-3 h-3 bg-red-500 rounded-full mr-1'></div>
                  <span>Cancelled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tips Card */}
          <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm'>
            <h3 className='text-lg font-medium text-gray-800 mb-4'>Quick Tips</h3>
            <div className='space-y-4'>
              <div className='flex gap-3'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                    <img className='w-5 h-5' src={assets.tick_icon} alt="" />
                  </div>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-700'>Approve appointments</p>
                  <p className='text-xs text-gray-500 mt-1'>
                    Click the check icon to approve a patient's appointment
                  </p>
                </div>
              </div>
              <div className='flex gap-3'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-red-100 rounded-full flex items-center justify-center'>
                    <img className='w-5 h-5' src={assets.cancel_icon} alt="" />
                  </div>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-700'>Cancel appointments</p>
                  <p className='text-xs text-gray-500 mt-1'>
                    Click the X icon to cancel a patient's appointment
                  </p>
                </div>
              </div>
              <div className='flex gap-3'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
                    <img className='w-5 h-5' src={assets.list_icon} alt="" />
                  </div>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-700'>Filter by status</p>
                  <p className='text-xs text-gray-500 mt-1'>
                    Use the tabs to filter appointments by status
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorDashboard