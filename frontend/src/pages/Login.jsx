import React, { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

const Login = () => {
  const [state, setState] = useState('Sign Up')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [validId, setValidId] = useState(null)
  const [dob, setDob] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { backendUrl, setToken } = useContext(AppContext)

  const handleToken = (token) => {
    localStorage.setItem('token', token);
    setToken(`Bearer ${token}`);
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    
    if (state === 'Sign Up' && !acceptTerms) {
      toast.error('Please accept the Terms and Conditions to proceed')
      return
    }
    
    setLoading(true)

    try {
      if (state === 'Sign Up') {
        if (!validId) {
          toast.error('Please upload a valid ID')
          return
        }

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
          setState('Login')
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

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        <p className='text-2xl font-semibold'>{state === 'Sign Up' ? 'Create Account' : 'Login'}</p>
        <p>Please {state === 'Sign Up' ? 'sign up' : 'log in'} to book appointment</p>
        
        {state === 'Sign Up' && (
          <>
            <div className='w-full'>
              <p>Last Name</p>
              <input 
                onChange={(e) => setLastName(e.target.value)} 
                value={lastName} 
                className='border border-[#DADADA] rounded w-full p-2 mt-1' 
                type="text" 
                required 
              />
            </div>

            <div className='w-full'>
              <p>First Name</p>
              <input 
                onChange={(e) => setFirstName(e.target.value)} 
                value={firstName} 
                className='border border-[#DADADA] rounded w-full p-2 mt-1' 
                type="text" 
                required 
              />
            </div>

            <div className='w-full'>
              <p>Middle Name</p>
              <input 
                onChange={(e) => setMiddleName(e.target.value)} 
                value={middleName} 
                className='border border-[#DADADA] rounded w-full p-2 mt-1' 
                type="text" 
              />
            </div>

            <div className='w-full'>
              <p>Date of Birth</p>
              <input 
                onChange={(e) => setDob(e.target.value)} 
                value={dob} 
                className='border border-[#DADADA] rounded w-full p-2 mt-1' 
                type="date" 
                required
                max={new Date().toISOString().split('T')[0]}
              />
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
                Please upload a clear image of you and your government-issued ID
              </p>
            </div>
          </>
        )}
        
        <div className='w-full'>
          <p>Email</p>
          <input 
            onChange={(e) => setEmail(e.target.value)} 
            value={email} 
            className='border border-[#DADADA] rounded w-full p-2 mt-1' 
            type="email" 
            required 
          />
        </div>
        
        <div className='w-full'>
          <p>Password</p>
          <input 
            onChange={(e) => setPassword(e.target.value)} 
            value={password} 
            className='border border-[#DADADA] rounded w-full p-2 mt-1' 
            type="password" 
            required 
          />
        </div>

        {state === 'Sign Up' && (
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
          {loading ? 'Processing...' : state === 'Sign Up' ? 'Create account' : 'Login'}
        </button>
        
        {state === 'Sign Up' ? (
          <p>Already have an account? <span onClick={() => setState('Login')} className='text-primary underline cursor-pointer'>Login here</span></p>
        ) : (
          <p>Create a new account? <span onClick={() => setState('Sign Up')} className='text-primary underline cursor-pointer'>Click here</span></p>
        )}
      </div>
    </form>
  )
}

export default Login