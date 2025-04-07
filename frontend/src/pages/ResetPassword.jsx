import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const { backendUrl } = useContext(AppContext)
  
  const [email, setEmail] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    isValid: false,
    hasMinLength: false,
    hasLetter: false,
    hasNumber: false
  })

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
    const newPass = e.target.value;
    setNewPassword(newPass);
    checkPasswordStrength(newPass);
  };

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        setVerifying(true);
        const { data } = await axios.get(`${backendUrl}/api/user/reset-password/${token}`);
        
        if (data.success) {
          setTokenValid(true);
          setEmail(data.email);
        } else {
          toast.error(data.message);
          setTokenValid(false);
        }
      } catch (error) {
        console.error('Token verification error:', error);
        toast.error(error.response?.data?.message || 'Invalid or expired reset link');
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, backendUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    if (!passwordStrength.isValid) {
      toast.error('Please create a stronger password that meets all requirements');
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(`${backendUrl}/api/user/reset-password/${token}`, {
        oldPassword,
        newPassword,
        confirmPassword
      });

      if (data.success) {
        toast.success(data.message);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold mb-4">Invalid or Expired Link</h2>
          <p className="text-gray-600 mb-6">
            The password reset link is invalid or has expired. Please request a new password reset link.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-primary text-white px-6 py-2 rounded-md"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="min-h-[80vh] flex items-center">
      <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg">
        <p className="text-2xl font-semibold">Reset Password</p>
        <p>Please enter your old password and create a new password</p>
        
        <div className="w-full">
          <p>Email</p>
          <input 
            value={email} 
            className="border border-[#DADADA] rounded w-full p-2 mt-1 bg-gray-100" 
            type="email" 
            disabled
          />
        </div>
        
        <div className="w-full">
          <p>Old Password</p>
          <div className="relative">
            <input 
              onChange={(e) => setOldPassword(e.target.value)} 
              value={oldPassword} 
              className="border border-[#DADADA] rounded w-full p-2 mt-1"
              type={showOldPassword ? "text" : "password"}
              required 
            />
            <label className="flex items-center gap-2 text-sm mt-1">
              <input
                type="checkbox"
                checked={showOldPassword}
                onChange={(e) => setShowOldPassword(e.target.checked)}
              />
              Show Password
            </label>
          </div>
        </div>
        
        <div className="w-full">
          <p>New Password</p>
          <div className="relative">
            <input 
              onChange={handlePasswordChange} 
              value={newPassword} 
              className={`border rounded w-full p-2 mt-1 ${
                newPassword && !passwordStrength.isValid 
                  ? 'border-orange-400' 
                  : 'border-[#DADADA]'
              }`}
              type={showNewPassword ? "text" : "password"}
              required 
            />
            <label className="flex items-center gap-2 text-sm mt-1">
              <input
                type="checkbox"
                checked={showNewPassword}
                onChange={(e) => setShowNewPassword(e.target.checked)}
              />
              Show Password
            </label>
            
            {newPassword && (
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
        
        <div className="w-full">
          <p>Confirm New Password</p>
          <div className="relative">
            <input 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              value={confirmPassword} 
              className={`border rounded w-full p-2 mt-1 ${
                newPassword && confirmPassword && newPassword !== confirmPassword 
                  ? 'border-red-500' 
                  : 'border-[#DADADA]'
              }`}
              type={showConfirmPassword ? "text" : "password"}
              required 
            />
            <label className="flex items-center gap-2 text-sm mt-1">
              <input
                type="checkbox"
                checked={showConfirmPassword}
                onChange={(e) => setShowConfirmPassword(e.target.checked)}
              />
              Show Password
            </label>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
            )}
          </div>
        </div>
        
        <button 
          disabled={loading}
          className={`bg-primary text-white w-full py-2 my-2 rounded-md text-base ${
            loading ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Processing...' : 'Reset Password'}
        </button>
        
        <p>
          Remember your password? <span onClick={() => navigate('/login')} className="text-primary underline cursor-pointer">Login here</span>
        </p>
      </div>
    </form>
  );
};

export default ResetPassword;
