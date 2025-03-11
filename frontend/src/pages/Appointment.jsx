import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import axios from 'axios'
import { toast } from 'react-toastify'

const Appointment = () => {

    const { docId } = useParams()
    const { doctors, currencySymbol, backendUrl, token, getDoctosData } = useContext(AppContext)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

    const [docInfo, setDocInfo] = useState(false)
    const [docSlots, setDocSlots] = useState([])
    const [selectedDate, setSelectedDate] = useState(null)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [slotTime, setSlotTime] = useState('')
    const [availableDates, setAvailableDates] = useState(new Set())
    const [termsAccepted, setTermsAccepted] = useState(false)

    const navigate = useNavigate()

    // Function to get calendar days
    const getCalendarDays = (date) => {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        const startOffset = firstDay.getDay()
        const daysInMonth = lastDay.getDate()
        
        let days = []
        
        // Add empty cells for days before the first of the month
        for (let i = 0; i < startOffset; i++) {
            days.push(null)
        }
        
        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(date.getFullYear(), date.getMonth(), i))
        }
        
        return days
    }

    // Function to check if a date is selectable (between 5 days and 1 month from now)
    const isDateSelectable = (date) => {
        if (!date) return false
        const today = new Date()
        const minDate = new Date(today)
        minDate.setDate(today.getDate() + 4)
        const maxDate = new Date(today)
        maxDate.setMonth(today.getMonth() + 1)
        
        return date >= minDate && date <= maxDate
    }

    const handleDateClick = (date) => {
        if (!date || !isDateSelectable(date)) return
        setSelectedDate(date)
        
        // Get time slots for the selected date
        const timeSlots = []
        const currentDate = new Date(date)
        currentDate.setHours(10, 0, 0, 0)
        const endTime = new Date(date)
        endTime.setHours(21, 0, 0, 0)

        while (currentDate < endTime) {
            const formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            const day = currentDate.getDate()
            const month = currentDate.getMonth() + 1
            const year = currentDate.getFullYear()
            const slotDate = `${day}_${month}_${year}`
            
            const isSlotAvailable = !(docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(formattedTime))
            
            timeSlots.push({
                datetime: new Date(currentDate),
                time: formattedTime,
                available: isSlotAvailable
            })
            
            currentDate.setMinutes(currentDate.getMinutes() + 30)
        }
        
        setDocSlots([timeSlots])
        setSlotTime('')
    }

    const changeMonth = (offset) => {
        const newDate = new Date(currentMonth)
        newDate.setMonth(newDate.getMonth() + offset)
        setCurrentMonth(newDate)
    }

    const fetchDocInfo = async () => {
        const docInfo = doctors.find((doc) => doc._id === docId)
        setDocInfo(docInfo)
    }

    const bookAppointment = async () => {

        if (!token) {
            toast.warning('Login to book appointment')
            return navigate('/login')
        }

        const date = selectedDate

        let day = date.getDate()
        let month = date.getMonth() + 1
        let year = date.getFullYear()

        const slotDate = `${day}_${month}_${year}`

        try {

            const { data } = await axios.post(backendUrl + '/api/user/book-appointment', { docId, slotDate, slotTime }, { headers: { token } })
            if (data.success) {
                toast.success(data.message)
                navigate('/my-appointments')
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    useEffect(() => {
        if (doctors.length > 0) {
            fetchDocInfo()
        }
    }, [doctors, docId])

    return docInfo ? (
        <div>

            {/* ---------- Doctor Details ----------- */}
            <div className='flex flex-col sm:flex-row gap-4'>
                <div>
                    <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
                </div>

                <div className='flex-1 border border-[#ADADAD] rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>

                    {/* ----- Doc Info : name, degree, experience ----- */}

                    <p className='flex items-center gap-2 text-3xl font-medium text-gray-700'>Dr. {docInfo.name} {docInfo.name_extension && <span className="text-gray-500">{docInfo.name_extension}</span>} <img className='w-5' src={assets.verified_icon} alt="" /></p>
                    <div className='flex items-center gap-2 mt-1 text-gray-600'>
                        <p>{docInfo.degree} - {docInfo.speciality}</p>
                        <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
                    </div>

                    {/* ----- Doc About ----- */}
                    <div>
                        <p className='flex items-center gap-1 text-sm font-medium text-[#262626] mt-3'>About <img className='w-3' src={assets.info_icon} alt="" /></p>
                        <p className='text-sm text-gray-600 max-w-[700px] mt-1'>{docInfo.about}</p>
                    </div>
                    {/*
                    <p className='text-gray-600 font-medium mt-4'>Appointment fee: <span className='text-gray-800'>{currencySymbol}{docInfo.fees}</span> </p>
                        */}
                    </div>
            </div>

            {/* Calendar View */}
            <div className='sm:ml-72 sm:pl-4 mt-8 font-medium text-[#565656]'>
                <p>Select Appointment Date</p>
                
                {/* Month Navigation */}
                <div className="flex justify-between items-center mt-4 mb-2">
                    <button 
                        onClick={() => changeMonth(-1)}
                        className="px-4 py-2 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
                    >
                        Previous
                    </button>
                    <h2 className="text-xl font-semibold">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h2>
                    <button 
                        onClick={() => changeMonth(1)}
                        className="px-4 py-2 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
                    >
                        Next
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="border rounded-lg overflow-hidden">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 bg-gray-50">
                        {daysOfWeek.map(day => (
                            <div key={day} className="py-2 text-center text-sm font-medium">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar days */}
                    <div className="grid grid-cols-7">
                        {getCalendarDays(currentMonth).map((date, index) => (
                            <div
                                key={index}
                                onClick={() => handleDateClick(date)}
                                className={`
                                    p-2 border-t border-l first:border-l-0 text-center min-h-[80px]
                                    ${!date ? 'bg-gray-50' : ''}
                                    ${date && isDateSelectable(date) ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed'}
                                    ${date && selectedDate && date.toDateString() === selectedDate.toDateString() ? 'bg-primary text-white' : ''}
                                    ${date && !isDateSelectable(date) ? 'text-gray-400' : ''}
                                `}
                            >
                                {date ? (
                                    <div className="flex flex-col items-center">
                                        <span className={`text-lg ${date && isDateSelectable(date) ? 'font-semibold' : ''}`}>
                                            {date.getDate()}
                                        </span>
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Time Slots */}
                {selectedDate && (
                    <div className="mt-6">
                        <p className="mb-3">Select Time Slot for {selectedDate.toLocaleDateString()}</p>
                        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full'>
                            {docSlots[0]?.map((item, index) => (
                                <p 
                                    onClick={() => item.available && setSlotTime(item.time)} 
                                    key={index} 
                                    className={`
                                        text-sm font-light flex-shrink-0 px-5 py-2 rounded-full 
                                        ${!item.available 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : item.time === slotTime 
                                                ? 'bg-primary text-white cursor-pointer' 
                                                : 'text-[#949494] border border-[#B4B4B4] cursor-pointer hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    {item.time.toLowerCase()}
                                </p>
                            ))}
                        </div>
                    </div>
                )}
<br />
                {selectedDate && slotTime && (
                    <div className="flex flex-col items-center">
                        <div className="flex items-start mb-4 w-full max-w-xl bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
                            <input 
                                type="checkbox" 
                                id="terms-checkbox" 
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                className="mt-1 mr-3 h-5 w-5 accent-primary cursor-pointer"
                            />
                            <label htmlFor="terms-checkbox" className="text-sm text-gray-700 leading-relaxed">
                                <span className="font-medium text-primary">Important:</span> By checking this box, I confirm that I will arrive <span className="font-medium">15 minutes BEFORE</span> the scheduled appointment time. I understand that once an appointment is 'approved' by the doctor, it cannot be cancelled. I also acknowledge that spam booking will result in my account being <span className="font-medium">PERMANENTLY BANNED</span>.
                            </label>
                        </div>
                        <button 
                            onClick={bookAppointment} 
                            className={`${termsAccepted ? 'bg-primary hover:bg-primary-dark' : 'bg-gray-400'} text-white font-medium px-20 py-3 rounded-full my-6 transition-all duration-300 shadow-md`}
                            disabled={!termsAccepted}
                        >
                            {termsAccepted ? 'Book an appointment' : 'Please accept terms to continue'}
                        </button>
                    </div>
                )}
            </div>

            {/* Listing Releated Doctors */}
            <RelatedDoctors speciality={docInfo.speciality} docId={docId} />
        </div>
    ) : null
}

export default Appointment