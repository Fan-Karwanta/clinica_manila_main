import React, { useState, useContext, useEffect } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { IoNotificationsOutline, IoClose, IoHomeOutline, IoPersonOutline, IoInformationCircleOutline, IoMailOutline, IoDocumentTextOutline, IoCalendarOutline, IoLogOutOutline } from 'react-icons/io5'
import axios from 'axios'

const Navbar = () => {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { token, setToken, userData, backendUrl, setState, setLoginState } = useContext(AppContext)

  // Add months array for date formatting
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  // Function to format the date (20_01_2000 => 20 Jan 2000)
  const formatDate = (slotDate) => {
    const dateArray = slotDate.split('_')
    return dateArray[0] + " " + months[Number(dateArray[1]) - 1] + " " + dateArray[2]
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(false)
    navigate('/login')
  }

  // Function to fetch appointments and check for notifications
  const checkForNotifications = async () => {
    if (!token) return;
    
    try {
      const { data } = await axios.get(backendUrl + '/api/user/appointments', { 
        headers: { 
          token: token,
          'Content-Type': 'application/json'
        } 
      })
      
      if (data.success) {
        const appointments = data.appointments || []
        const newNotifications = appointments
          .filter(app => !app.isRead && (app.isCompleted || app.cancelled))
          .map(app => ({
            id: app._id,
            message: `Your appointment with Dr. ${app.docData.name} has been `,
            status: app.cancelled ? 'cancelled' : 'approved',
            timestamp: app.date,
            slotDate: app.slotDate,
            slotTime: app.slotTime,
            read: false,
            appointment: app
          }))
          .sort((a, b) => b.timestamp - a.timestamp)

        setNotifications(newNotifications)
        setUnreadCount(newNotifications.length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  // Reset badge when modal is opened
  const handleNotificationClick = () => {
    setShowNotifications(true)
    setUnreadCount(0) // Reset badge when notifications are viewed
  }

  // Handle individual notification click
  const handleNotificationItemClick = async (notification) => {
    try {
      const response = await axios.post(
        backendUrl + '/api/user/mark-appointment-read',
        { appointmentId: notification.appointment._id },
        { 
          headers: { 
            token: token,
            'Content-Type': 'application/json'
          } 
        }
      )
      
      if (response.data.success) {
        // Update local state
        setNotifications(prev => prev.filter(n => n.id !== notification.id))
        
        // Navigate to appointments page
        navigate('/my-appointments')
        setShowNotifications(false)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Check for notifications on mount and when token changes
  useEffect(() => {
    if (token) {
      checkForNotifications()
      // Check every minute for new notifications
      const interval = setInterval(checkForNotifications, 60000)
      return () => clearInterval(interval)
    }
  }, [token])

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-[#ADADAD]'>
      <img onClick={() => navigate('/')} className='w-44 cursor-pointer' src={assets.logo} alt="" />
      <ul className='md:flex items-start gap-5 font-medium hidden'>
        <NavLink to='/' onClick={() => setShowMenu(false)}>
          <li className='py-1 hover:text-primary transition-colors'>HOME</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/doctors' onClick={() => setShowMenu(false)}>
          <li className='py-1 hover:text-primary transition-colors'>ALL DOCTORS</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/about' onClick={() => setShowMenu(false)}>
          <li className='py-1 hover:text-primary transition-colors'>ABOUT</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/contact' onClick={() => setShowMenu(false)}>
          <li className='py-1 hover:text-primary transition-colors'>CONTACT</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/terms' onClick={() => setShowMenu(false)}>
          <li className='py-1 hover:text-primary transition-colors'>TERMS & CONDITIONS</li>
          <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
      </ul>

      <div className='flex items-center gap-4'>
        {token && userData ? (
          <>
            {/* Notification Bell */}
            <div className='relative cursor-pointer' onClick={handleNotificationClick}>
              <IoNotificationsOutline className='text-2xl' />
              {unreadCount > 0 && (
                <div className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs'>
                  {unreadCount}
                </div>
              )}
            </div>

            {/* Notification Modal */}
            {showNotifications && (
              <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20'>
                <div className='bg-white rounded-lg shadow-lg w-full max-w-md mx-4'>
                  <div className='flex items-center justify-between p-4 border-b'>
                    <h3 className='text-lg font-semibold'>Notifications</h3>
                    <IoClose
                      className='text-2xl cursor-pointer'
                      onClick={() => setShowNotifications(false)}
                    />
                  </div>
                  <div className='max-h-[60vh] overflow-y-auto'>
                    {notifications.length === 0 ? (
                      <div className='p-4 text-center text-gray-500'>
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationItemClick(notification)}
                          className='p-4 border-b cursor-pointer hover:bg-gray-50'
                        >
                          <p className='text-sm'>
                            {notification.message}
                            <span className={`${
                              notification.status === 'cancelled' 
                                ? 'text-red-500' 
                                : 'text-green-500'
                            } font-medium`}>
                              {notification.status}
                            </span>
                          </p>
                          <p className='text-xs text-gray-600 mt-1'>
                            Date & Time: {formatDate(notification.slotDate)} | {notification.slotTime}
                          </p>
                          <p className='text-xs text-gray-500 mt-1'>
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* User dropdown - hidden on mobile */}
            <div className='hidden md:flex items-center gap-2 cursor-pointer group relative'>
            <img className='w-8 h-8 rounded-full' src={userData.image || assets.profile_placeholder} alt="Profile" />
              <img className='w-2.5' src={assets.dropdown_icon} alt="" />
              <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
                <div className='min-w-48 bg-gray-50 rounded flex flex-col gap-4 p-4'>
                  <p onClick={() => navigate('/my-profile')} className='hover:text-black cursor-pointer'>My Profile</p>
                  <p onClick={() => navigate('/my-appointments')} className='hover:text-black cursor-pointer'>My Appointments</p>
                  <p onClick={logout} className='hover:text-black cursor-pointer'>Logout</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 hidden md:flex">
            <button onClick={() => {
              navigate('/login');
              setLoginState('Sign Up');
            }} className='bg-primary text-white px-6 py-2.5 rounded-full font-light hover:bg-primary/90 transition-colors'>
              Sign up
            </button>
            <button onClick={() => {
              navigate('/login');
              setLoginState('Login');
            }} className='border-2 border-primary text-primary px-6 py-2.5 rounded-full font-light hover:bg-primary/5 transition-colors'>
              Login
            </button>
          </div>
        )}
        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="" />

        {/* Mobile Menu */}
        {showMenu && (
          <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end'>
            <div className='w-80 bg-white h-full shadow-xl'>
              <div className='flex justify-between items-center p-6 border-b border-gray-200'>
                <img className='w-32' src={assets.logo} alt="Clinica Manila" />
                <IoClose 
                  onClick={() => setShowMenu(false)} 
                  className='text-2xl cursor-pointer hover:text-primary transition-colors' 
                />
              </div>
              
              {token && userData ? (
                <>
                  {/* User info section for mobile */}
                  <div className='px-6 py-4 bg-gray-50'>
                    <div className='font-medium text-lg text-primary flex items-center gap-2'>
                      <IoPersonOutline className='text-xl' />
                      {userData.firstName} {userData.lastName}
                    </div>
                  </div>
                  
                  <ul className='flex flex-col gap-4 font-medium p-6'>
                    <NavLink to='/' onClick={() => setShowMenu(false)}>
                      <li className='flex items-center gap-2 hover:text-primary transition-colors'><IoHomeOutline className='text-lg' /> HOME</li>
                    </NavLink>
                    <NavLink to='/doctors' onClick={() => setShowMenu(false)}>
                      <li className='flex items-center gap-2 hover:text-primary transition-colors'><IoPersonOutline className='text-lg' /> ALL DOCTORS</li>
                    </NavLink>
                    <NavLink to='/about' onClick={() => setShowMenu(false)}>
                      <li className='flex items-center gap-2 hover:text-primary transition-colors'><IoInformationCircleOutline className='text-lg' /> ABOUT</li>
                    </NavLink>
                    <NavLink to='/contact' onClick={() => setShowMenu(false)}>
                      <li className='flex items-center gap-2 hover:text-primary transition-colors'><IoMailOutline className='text-lg' /> CONTACT</li>
                    </NavLink>
                    <NavLink to='/terms' onClick={() => setShowMenu(false)}>
                      <li className='flex items-center gap-2 hover:text-primary transition-colors'><IoDocumentTextOutline className='text-lg' /> TERMS & CONDITIONS</li>
                    </NavLink>
                    <hr className='border-gray-200 my-4' />
                    {/* User specific links */}
                    <NavLink to='/my-profile' onClick={() => setShowMenu(false)}>
                      <li className='flex items-center gap-2 hover:text-primary transition-colors'><IoPersonOutline className='text-lg' /> MY PROFILE</li>
                    </NavLink>
                    <NavLink to='/my-appointments' onClick={() => setShowMenu(false)}>
                      <li className='flex items-center gap-2 hover:text-primary transition-colors'><IoCalendarOutline className='text-lg' /> MY APPOINTMENTS</li>
                    </NavLink>
                    <li onClick={() => {
                      logout();
                      setShowMenu(false);
                    }} className='flex items-center gap-2 cursor-pointer text-red-500 hover:text-red-600 transition-colors'><IoLogOutOutline className='text-lg' /> LOGOUT</li>
                  </ul>
                </>
              ) : (
                <>
                  <ul className='flex flex-col gap-4 font-medium p-6'>
                    <NavLink to='/' onClick={() => setShowMenu(false)}>
                      <li className='flex items-center gap-2 hover:text-primary transition-colors'><IoHomeOutline className='text-lg' /> HOME</li>
                    </NavLink>
                    <NavLink to='/doctors' onClick={() => setShowMenu(false)}>
                      <li className='flex items-center gap-2 hover:text-primary transition-colors'><IoPersonOutline className='text-lg' /> ALL DOCTORS</li>
                    </NavLink>
                    <NavLink to='/about' onClick={() => setShowMenu(false)}>
                      <li className='flex items-center gap-2 hover:text-primary transition-colors'><IoInformationCircleOutline className='text-lg' /> ABOUT</li>
                    </NavLink>
                    <NavLink to='/contact' onClick={() => setShowMenu(false)}>
                      <li className='flex items-center gap-2 hover:text-primary transition-colors'><IoMailOutline className='text-lg' /> CONTACT</li>
                    </NavLink>
                    <NavLink to='/terms' onClick={() => setShowMenu(false)}>
                      <li className='flex items-center gap-2 hover:text-primary transition-colors'><IoDocumentTextOutline className='text-lg' /> TERMS & CONDITIONS</li>
                    </NavLink>
                  </ul>
                  
                  {/* Login/Signup buttons for mobile */}
                  <div className='mt-8 flex flex-col gap-4 p-6'>
                    <button onClick={() => {
                      navigate('/login');
                      setLoginState('Sign Up');
                      setShowMenu(false);
                    }} className='bg-primary text-white px-6 py-2.5 rounded-full font-light hover:bg-primary/90 transition-colors'>
                      Sign up
                    </button>
                    <button onClick={() => {
                      navigate('/login');
                      setLoginState('Login');
                      setShowMenu(false);
                    }} className='border-2 border-primary text-primary px-6 py-2.5 rounded-full font-light hover:bg-primary/5 transition-colors'>
                      Login
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Navbar