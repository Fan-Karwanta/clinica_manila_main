import React, { useContext, useState, useEffect, useRef } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate, useLocation } from 'react-router-dom'

const Login = () => {
  const location = useLocation()
  const { loginState, setLoginState, backendUrl, setToken } = useContext(AppContext)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState(null)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordStrength, setPasswordStrength] = useState({
    isValid: false,
    hasMinLength: false,
    hasLetter: false,
    hasNumber: false
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validId, setValidId] = useState(null)
  const [dob, setDob] = useState('')
  const [ageError, setAgeError] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const emailTimeoutRef = useRef(null)

  const navigate = useNavigate()

  const handleToken = (token) => {
    localStorage.setItem('token', token);
    setToken(`Bearer ${token}`);
  };

  const checkEmailStatus = async (emailToCheck) => {
    if (!emailToCheck || emailToCheck.trim() === '') {
      setEmailStatus(null)
      return
    }

    try {
      setCheckingEmail(true)
      const { data } = await axios.post(`${backendUrl}/api/user/check-email`, {
        email: emailToCheck
      })
      
      if (data.success) {
        if (data.exists) {
          setEmailStatus(data.status)
        } else {
          setEmailStatus('available')
        }
      } else {
        setEmailStatus(null)
      }
    } catch (error) {
      console.error('Error checking email:', error)
      setEmailStatus(null)
    } finally {
      setCheckingEmail(false)
    }
  }

  const handleEmailChange = (e) => {
    const newEmail = e.target.value
    setEmail(newEmail)
    
    // Clear any existing timeout
    if (emailTimeoutRef.current) {
      clearTimeout(emailTimeoutRef.current)
    }
    
    // Set new timeout to check email status after 500ms of user stopping typing
    if (newEmail && newEmail.includes('@')) {
      setCheckingEmail(true)
      emailTimeoutRef.current = setTimeout(() => {
        checkEmailStatus(newEmail)
      }, 500)
    } else {
      setEmailStatus(null)
      setCheckingEmail(false)
    }
  }

  useEffect(() => {
    return () => {
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current)
      }
    }
  }, [])

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Handle date of birth change
  const handleDobChange = (e) => {
    const newDob = e.target.value;
    setDob(newDob);
    const age = calculateAge(newDob);
    setAgeError(age < 18);
  };

  // Check password strength
  const checkPasswordStrength = (pass) => {
    const strength = {
      isValid: false,
      hasMinLength: pass.length >= 8,
      hasLetter: /[a-zA-Z]/.test(pass),
      hasNumber: /[0-9]/.test(pass)
    };
    
    // Password is valid if it meets all criteria
    strength.isValid = strength.hasMinLength && strength.hasLetter && strength.hasNumber;
    
    setPasswordStrength(strength);
    return strength;
  };

  // Handle password change with validation
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    checkPasswordStrength(newPassword);
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    
    if (loginState === 'Sign Up' && !acceptTerms) {
      toast.error('Please accept the Terms and Conditions to proceed')
      return
    }

    if (loginState === 'Sign Up' && password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (loginState === 'Sign Up' && !passwordStrength.isValid) {
      toast.error('Please create a stronger password that meets all requirements')
      return
    }

    if (loginState === 'Sign Up' && !validId) {
      toast.error('Please upload a valid ID')
      return
    }

    if (loginState === 'Sign Up' && dob && calculateAge(dob) < 18) {
      toast.error('You must be 18 years or older to register')
      return
    }
    
    setLoading(true)

    try {
      if (loginState === 'Sign Up') {
        const formData = new FormData()
        formData.append('firstName', firstName)
        formData.append('lastName', lastName)
        formData.append('middleName', middleName)
        formData.append('email', email)
        formData.append('password', password)
        formData.append('validId', validId)
        formData.append('dob', dob)

        const { data } = await axios.post(
          `${backendUrl}/api/user/register`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        )

        if (data.success) {
          toast.success(data.message)
          setLoginState('Login')
        } else {
          toast.error(data.message)
        }
      } else {
        const { data } = await axios.post(`${backendUrl}/api/user/login`, {
          email,
          password
        })

        if (data.success) {
          handleToken(data.token)
          toast.success('Login successful!')
          navigate('/')
        } else {
          toast.error(data.message)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error(error.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Handle forgot password submission
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail) {
      toast.error('Please enter your email address');
      return;
    }
    
    setForgotPasswordLoading(true);
    
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/forgot-password`, {
        email: forgotPasswordEmail
      });
      
      if (data.success) {
        toast.success(data.message);
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <>
      {showForgotPassword ? (
        <form onSubmit={handleForgotPassword} className='min-h-[80vh] flex items-center'>
          <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
            <p className='text-2xl font-semibold'>Forgot Password</p>
            <p>Enter your email to receive a password reset link</p>
            
            <div className='w-full'>
              <p>Email</p>
              <input 
                onChange={(e) => setForgotPasswordEmail(e.target.value)} 
                value={forgotPasswordEmail} 
                className='border border-[#DADADA] rounded w-full p-2 mt-1' 
                type="email" 
                required 
              />
            </div>
            
            <button 
              disabled={forgotPasswordLoading}
              className={`bg-primary text-white w-full py-2 my-2 rounded-md text-base ${forgotPasswordLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
            
            <p>
              Remember your password? <span onClick={() => setShowForgotPassword(false)} className='text-primary underline cursor-pointer'>Back to Login</span>
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
          <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
            <p className='text-2xl font-semibold'>{loginState === 'Sign Up' ? 'Create Account' : 'Login'}</p>
            <p>Please {loginState === 'Sign Up' ? 'sign up' : 'log in'} to book appointment</p>
            
            {loginState === 'Sign Up' && (
              <>
                <div className='w-full'>
                  <p>Last Name</p>
                  <input 
                    onChange={(e) => setLastName(e.target.value.toUpperCase())} 
                    value={lastName} 
                    className='border border-[#DADADA] rounded w-full p-2 mt-1' 
                    type="text" 
                    required 
                  />
                </div>

                <div className='w-full'>
                  <p>First Name</p>
                  <input 
                    onChange={(e) => setFirstName(e.target.value.toUpperCase())} 
                    value={firstName} 
                    className='border border-[#DADADA] rounded w-full p-2 mt-1' 
                    type="text" 
                    required 
                  />
                </div>

                <div className='w-full'>
                  <p>Middle Name</p>
                  <input 
                    onChange={(e) => setMiddleName(e.target.value.toUpperCase())} 
                    value={middleName} 
                    className='border border-[#DADADA] rounded w-full p-2 mt-1' 
                    type="text" 
                  />
                </div>

                <div className='w-full'>
                  <p>Date of Birth</p>
                  <input 
                    onChange={handleDobChange} 
                    value={dob} 
                    className={`border rounded w-full p-2 mt-1 ${
                      loginState === 'Sign Up' && dob && calculateAge(dob) < 18 
                        ? 'border-red-500' 
                        : 'border-[#DADADA]'
                    }`} 
                    type="date" 
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {loginState === 'Sign Up' && dob && calculateAge(dob) < 18 && (
                    <p className="text-red-500 text-xs mt-1">
                      You must be 18 years or older to register
                    </p>
                  )}
                </div>

                <div className='w-full'>
                  <p>Selfie with Valid ID (Government-issued)</p>
                  <input
                    onChange={(e) => setValidId(e.target.files[0])}
                    className='border border-[#DADADA] rounded w-full p-2 mt-1'
                    type="file"
                    accept="image/*"
                    required
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Please upload a clear image of you and your government-issued ID - ( Format: .png, .jpg, .jpeg )
                  </p>
                </div>
              </>
            )}
            
            <div className='w-full'>
              <p>Email</p>
              <input 
                onChange={handleEmailChange} 
                value={email} 
                className='border border-[#DADADA] rounded w-full p-2 mt-1' 
                type="email" 
                required 
              />
              {checkingEmail && (
                <p className="text-xs mt-1 text-gray-500">Checking email status...</p>
              )}
              {!checkingEmail && emailStatus && (
                <p className={`text-xs mt-1 ${
                  emailStatus === 'available' ? 'text-green-600' : 
                  emailStatus === 'approved' ? 'text-blue-600' : 
                  emailStatus === 'pending' ? 'text-orange-600' : 
                  'text-red-600'
                }`}>
                  {emailStatus === 'available' && 'Email is available for registration.'}
                  {emailStatus === 'approved' && 'Email is already registered and approved. Please login.'}
                  {emailStatus === 'pending' && 'Email is already registered and pending approval.'}
                  {emailStatus === 'declined' && 'Email registration was declined. Please contact support.'}
                  {emailStatus === 'blocked' && 'This account has been blocked. Please contact support.'}
                </p>
              )}
            </div>
            
            <div className='w-full'>
              <p>Password</p>
              <div className='relative'>
                <input 
                  onChange={handlePasswordChange} 
                  value={password} 
                  className={`border rounded w-full p-2 mt-1 ${
                    loginState === 'Sign Up' && password && !passwordStrength.isValid 
                      ? 'border-orange-400' 
                      : 'border-[#DADADA]'
                  }`}
                  type={showPassword ? "text" : "password"}
                  required 
                />
                <label className='flex items-center gap-2 text-sm mt-1'>
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
                  Show Password
                </label>
                
                {loginState === 'Sign Up' && password && (
                  <div className="mt-2 text-xs">
                    <p className="font-medium mb-1">Password must contain:</p>
                    <ul className="space-y-1 pl-2">
                      <li className={passwordStrength.hasMinLength ? "text-green-600" : "text-gray-500"}>
                        ✓ At least 8 characters
                      </li>
                      <li className={passwordStrength.hasLetter ? "text-green-600" : "text-gray-500"}>
                        ✓ At least one letter (a-z, A-Z)
                      </li>
                      <li className={passwordStrength.hasNumber ? "text-green-600" : "text-gray-500"}>
                        ✓ At least one number (0-9)
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {loginState === 'Sign Up' && (
              <div className='w-full'>
                <p>Confirm Password</p>
                <div className='relative'>
                  <input 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    value={confirmPassword} 
                    className={`border rounded w-full p-2 mt-1 ${password && confirmPassword && password !== confirmPassword ? 'border-red-500' : 'border-[#DADADA]'}`}
                    type={showConfirmPassword ? "text" : "password"}
                    required 
                  />
                  <label className='flex items-center gap-2 text-sm mt-1'>
                    <input
                      type="checkbox"
                      checked={showConfirmPassword}
                      onChange={(e) => setShowConfirmPassword(e.target.checked)}
                    />
                    Show Password
                  </label>
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>
            )}
            
            {loginState === 'Sign Up' && (
              <div className='w-full'>
                <label className='flex items-start gap-2 text-sm text-gray-600 mt-2'>
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className='mt-1'
                    required
                  />
                  <span>
                    I agree to Clinica Manila's <button type="button" onClick={() => window.open('/terms', '_blank')} className='text-primary hover:underline'>Terms and Conditions</button> and consent to the collection and processing of my personal information. I understand that the information I provide will be used to:
                    <ul className='list-disc ml-4 mt-1 text-xs'>
                      <li>Create and manage my account</li>
                      <li>Process and manage my appointments</li>
                      <li>Communicate important updates and medical information</li>
                      <li>Verify my identity for security purposes</li>
                    </ul>
                    <p className='text-xs mt-1'>
                      By checking this box, I acknowledge that I have read and understood how my personal data will be used and protected in accordance with Clinica Manila's privacy policy.
                    </p>
                  </span>
                </label>
              </div>
            )}
            
            <button 
              disabled={loading}
              className={`bg-primary text-white w-full py-2 my-2 rounded-md text-base ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Processing...' : loginState === 'Sign Up' ? 'Create account' : 'Login'}
            </button>
            
            {loginState === 'Sign Up' ? (
              <p>Already have an account? <span onClick={() => setLoginState('Login')} className='text-primary underline cursor-pointer'>Login here</span></p>
            ) : (
              <>
                <p>Create a new account? <span onClick={() => setLoginState('Sign Up')} className='text-primary underline cursor-pointer'>Click here</span></p>
                <p>Forgot password? <span onClick={() => setShowForgotPassword(true)} className='text-primary underline cursor-pointer'>Reset here</span></p>
              </>
            )}
          </div>
        </form>
      )}
    </>
  )
}

export default Login