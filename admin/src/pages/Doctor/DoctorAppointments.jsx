import React from 'react'
import { useContext, useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const DoctorAppointments = () => {

  const { dToken, appointments, getAppointments, cancelAppointment, completeAppointment } = useContext(DoctorContext)
  const { slotDateFormat } = useContext(AppContext)

  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])

  return (
    <div className='w-full max-w-6xl m-5'>
      <p className='mb-4 text-lg font-medium'>All Appointments</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-auto'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1.5fr] gap-2 py-3 px-6 border-b bg-gray-50'>
          <p>#</p>
          <p>Full Name (LN, FN, MN)</p>
          <p>Date & Time</p>
          <p>Action</p>
        </div>
        
        {appointments.map((item, index) => (
          <div className='flex flex-wrap max-sm:gap-4 sm:grid grid-cols-[0.5fr_2fr_1fr_1.5fr] gap-2 items-center text-gray-600 py-3 px-6 border-b hover:bg-gray-50' key={index}>
            {/* Index */}
            <p className='max-sm:hidden'>{index + 1}</p>
            
            {/* Patient Name */}
            <div className='flex items-center gap-1'>
              <p>{item.userData.lastName},</p>
              <p>{item.userData.firstName},</p>
              <p>{item.userData.middleName}</p>
            </div>
            
            {/* Date and Time */}
            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            
            {/* Status/Actions */}
            {item.cancelled ? (
              <p className='text-red-400 text-xs font-medium'>Cancelled</p>
            ) : item.isCompleted ? (
              <p className='text-green-500 text-xs font-medium'>Approved</p>
            ) : (
              <div className='flex gap-3'>
                <img 
                  onClick={() => cancelAppointment(item._id)} 
                  className='w-7 h-7 cursor-pointer' 
                  src={assets.cancel_icon} 
                  alt="Cancel" 
                />
                <img 
                  onClick={() => completeAppointment(item._id)} 
                  className='w-7 h-7 cursor-pointer' 
                  src={assets.tick_icon} 
                  alt="Complete" 
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default DoctorAppointments