import React, { useContext, useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const DoctorDashboard = () => {
  const { dToken, dashData, getDashData, cancelAppointment, completeAppointment, profileData, getProfileData } = useContext(DoctorContext)
  const { slotDateFormat } = useContext(AppContext)

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

  return (
    <div className='m-3 sm:m-5'>
      {/* Welcome Message */}
      <h1 className='text-xl sm:text-2xl font-semibold text-gray-800 mb-2'>
        Welcome back, Dr. {profileData?.name || 'Doctor'}
      </h1>
      <p className='text-gray-600 mb-6'>Here's what's happening with your appointments.</p>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-8'>
        <div className='bg-white p-4 sm:p-6 rounded border-2 border-gray-100'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Next Appointment</p>
              <p className='text-lg sm:text-xl font-semibold text-gray-800'>{nextAppointment ? '1' : '0'}</p>
            </div>
            <div className='bg-blue-50 p-3 rounded-full'>
              <img className='w-6 h-6' src={assets.appointments_icon} alt="" />
            </div>
          </div>
          {nextAppointment && (
            <div className='text-sm'>
              <p className='text-gray-800 font-medium'>{slotDateFormat(nextAppointment.slotDate)}</p>
              <p className='text-gray-600 truncate'>
                {nextAppointment.slotTime} • {nextAppointment.userData?.firstName} {nextAppointment.userData?.lastName}
                {nextAppointment.isCompleted && <span className='ml-1 text-green-600'>(Approved)</span>}
              </p>
            </div>
          )}
        </div>

        <div className='bg-white p-4 sm:p-6 rounded border-2 border-gray-100'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Total Patients</p>
              <p className='text-lg sm:text-xl font-semibold text-gray-800'>{dashData.patients}</p>
            </div>
            <div className='bg-green-50 p-3 rounded-full'>
              <img className='w-6 h-6' src={assets.patients_icon} alt="" />
            </div>
          </div>
          <p className='text-sm text-gray-600'>Lifetime appointments: {dashData.appointments}</p>
        </div>

        <div className='bg-white p-4 sm:p-6 rounded border-2 border-gray-100'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Approval Rate</p>
              <p className='text-lg sm:text-xl font-semibold text-gray-800'>{completionRate}%</p>
            </div>
            <div className='bg-purple-50 p-3 rounded-full'>
              <img className='w-6 h-6' src={assets.tick_icon} alt="" />
            </div>
          </div>
          <p className='text-sm text-gray-600'>Approved: {completedAppointments} appointments</p>
        </div>

        <div className='bg-white p-4 sm:p-6 rounded border-2 border-gray-100'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Pending Actions</p>
              <p className='text-lg sm:text-xl font-semibold text-gray-800'>{pendingAppointments}</p>
            </div>
            <div className='bg-yellow-50 p-3 rounded-full'>
              <img className='w-6 h-6' src={assets.list_icon} alt="" />
            </div>
          </div>
          <p className='text-sm text-gray-600'>Requires your attention</p>
        </div>
      </div>

      {/* Latest Bookings */}
      <div className='bg-white rounded-lg border border-gray-100 overflow-hidden'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b gap-2'>
          <div className='flex items-center gap-2'>
            <img src={assets.list_icon} alt="" className='w-5 h-5' />
            <p className='font-semibold'>Latest Bookings</p>
          </div>
          <span className='text-sm text-gray-500'>Showing last 5 appointments</span>
        </div>

        <div className='divide-y'>
          {dashData.latestAppointments.slice(0, 5).map((item, index) => (
            <div 
              className='flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-gray-50 transition-colors' 
              key={index}
            >
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0'>
                    <span className='text-gray-600 font-medium'>
                      {item.userData?.firstName?.[0] || ''}{item.userData?.lastName?.[0] || ''}
                    </span>
                  </div>
                  <div className='min-w-0'>
                    <p className='text-gray-800 font-medium truncate'>
                      {item.userData?.lastName || ''}, {item.userData?.firstName || ''}
                    </p>
                    <p className='text-gray-500 text-sm'>
                      {slotDateFormat(item.slotDate)} • {item.slotTime}
                    </p>
                  </div>
                </div>
              </div>
              <div className='flex justify-end sm:w-auto'>
                {item.cancelled ? (
                  <span className='px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600'>
                    Cancelled
                  </span>
                ) : item.isCompleted ? (
                  <span className='px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600'>
                    Approved
                  </span>
                ) : (
                  <div className='flex gap-2'>
                    <button
                      onClick={() => cancelAppointment(item._id)}
                      className='p-2 hover:bg-red-50 rounded-full transition-colors'
                    >
                      <img className='w-5 h-5' src={assets.cancel_icon} alt="Cancel" />
                    </button>
                    <button
                      onClick={() => completeAppointment(item._id)}
                      className='p-2 hover:bg-green-50 rounded-full transition-colors'
                    >
                      <img className='w-5 h-5' src={assets.tick_icon} alt="Complete" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DoctorDashboard