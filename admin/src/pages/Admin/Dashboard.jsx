import React, { useContext, useEffect } from 'react'
import { assets } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const Dashboard = () => {
  const { aToken, getDashData, cancelAppointment, dashData, appointments, getAllAppointments } = useContext(AdminContext)
  const { slotDateFormat } = useContext(AppContext)

  useEffect(() => {
    if (aToken) {
      getDashData()
      getAllAppointments() // Get all appointments to calculate doctor stats
    }
  }, [aToken])

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

  return dashData && (
    <div className='m-3 sm:m-5'>
      {/* Welcome Message */}
      <div className='mb-6'>
        <h1 className='text-xl sm:text-2xl font-semibold text-gray-800 mb-2'>
          Admin Dashboard
        </h1>
        <p className='text-gray-600'>Here's an overview of your clinic's performance.</p>
      </div>

      {/* Main Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        <div className='bg-white p-4 sm:p-6 rounded-lg border-2 border-gray-100'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Total Doctors</p>
              <p className='text-lg sm:text-xl font-semibold text-gray-800'>{dashData.doctors}</p>
            </div>
            <div className='bg-blue-50 p-3 rounded-full'>
              <img className='w-6 h-6' src={assets.doctor_icon} alt="" />
            </div>
          </div>
          <div className='text-sm text-gray-600'>
            Active healthcare providers
          </div>
        </div>

        <div className='bg-white p-4 sm:p-6 rounded-lg border-2 border-gray-100'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Total Patients</p>
              <p className='text-lg sm:text-xl font-semibold text-gray-800'>{dashData.patients}</p>
            </div>
            <div className='bg-green-50 p-3 rounded-full'>
              <img className='w-6 h-6' src={assets.patients_icon} alt="" />
            </div>
          </div>
          <div className='text-sm text-gray-600'>
            Registered patients in the system
          </div>
        </div>

        <div className='bg-white p-4 sm:p-6 rounded-lg border-2 border-gray-100'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Total Appointments</p>
              <p className='text-lg sm:text-xl font-semibold text-gray-800'>{totalAppointments}</p>
            </div>
            <div className='bg-purple-50 p-3 rounded-full'>
              <img className='w-6 h-6' src={assets.appointments_icon} alt="" />
            </div>
          </div>
          <div className='text-sm text-gray-600'>
            <span className='text-green-600'>{completedAppointments} approved</span> • <span className='text-red-600'>{cancelledAppointments} cancelled</span>
          </div>
        </div>

        <div className='bg-white p-4 sm:p-6 rounded-lg border-2 border-gray-100'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Approval Rate</p>
              <p className='text-lg sm:text-xl font-semibold text-gray-800'>{completionRate}%</p>
            </div>
            <div className='bg-yellow-50 p-3 rounded-full'>
              <img className='w-6 h-6' src={assets.tick_icon} alt="" />
            </div>
          </div>
          <div className='text-sm text-gray-600'>
            {pendingAppointments} appointments pending
          </div>
        </div>
      </div>

      {/* Most Selected Doctors */}
      <div className='bg-white rounded-lg border border-gray-100 mb-6'>
        <div className='flex items-center justify-between px-4 sm:px-6 py-4 border-b'>
          <div className='flex items-center gap-2'>
            <img src={assets.doctor_icon} alt="" className='w-5 h-5' />
            <p className='font-semibold'>Most Selected Doctors</p>
          </div>
          <span className='text-sm text-gray-500'>Based on total appointments</span>
        </div>
        <div className='divide-y'>
          {mostSelectedDoctors.map((doctor, index) => (
            <div key={index} className='flex items-center gap-4 p-4 sm:px-6'>
              <div className='w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0'>
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

      {/* Latest Bookings */}
      <div className='bg-white rounded-lg border border-gray-100'>
        <div className='flex items-center justify-between px-4 sm:px-6 py-4 border-b'>
          <div className='flex items-center gap-2'>
            <img src={assets.list_icon} alt="" className='w-5 h-5' />
            <p className='font-semibold'>Latest Bookings</p>
          </div>
          <span className='text-sm text-gray-500'>Showing last 5 appointments</span>
        </div>

        <div className='divide-y'>
          {dashData.latestAppointments.slice(0, 5).map((item, index) => (
            <div className='flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:px-6 hover:bg-gray-50 transition-colors' key={index}>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gray-100 rounded-full overflow-hidden flex-shrink-0'>
                    <img src={item.docData.image} alt="" className='w-full h-full object-cover' />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-gray-800 font-medium truncate'>
                      Dr. {item.docData.name}
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
                  <button
                    onClick={() => cancelAppointment(item._id)}
                    className='p-2 hover:bg-red-50 rounded-full transition-colors'
                  >
                    <img className='w-5 h-5' src={assets.cancel_icon} alt="Cancel" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard