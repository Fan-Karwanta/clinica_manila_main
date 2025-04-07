import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

const MyProfile = () => {

    const [isEdit, setIsEdit] = useState(false)

    const [image, setImage] = useState(false)

    const [resetPasswordLoading, setResetPasswordLoading] = useState(false)
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showOldPassword, setShowOldPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordStrength, setPasswordStrength] = useState({
        isValid: false,
        hasMinLength: false,
        hasLetter: false,
        hasNumber: false
    })

    const { token, backendUrl, userData, setUserData, loadUserProfileData } = useContext(AppContext)

    // Function to update user profile data using API
    const updateUserProfileData = async () => {

        try {

            const formData = new FormData();

            formData.append('userId', userData._id)
            formData.append('firstName', userData.firstName)
            formData.append('lastName', userData.lastName)
            formData.append('phone', userData.phone)
            formData.append('address', JSON.stringify(userData.address))
            formData.append('gender', userData.gender)
            formData.append('dob', userData.dob)

            image && formData.append('image', image)

            const { data } = await axios.put(backendUrl + '/api/user/update-profile', formData, { 
                headers: { 
                    token,
                    'Content-Type': 'multipart/form-data'
                } 
            })

            if (data.success) {
                toast.success(data.message)
                // Reload user profile data after successful update
                loadUserProfileData()
                setIsEdit(false)
                setImage(false)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.response?.data?.message || error.message)
        }
    }

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

    // Handle reset password request
    const handleResetPassword = async () => {
        if (!oldPassword) {
            toast.error('Please enter your current password');
            return;
        }

        if (!newPassword || !confirmPassword) {
            toast.error('Please enter and confirm your new password');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('New password and confirm password do not match');
            return;
        }

        if (!passwordStrength.isValid) {
            toast.error('Please create a stronger password that meets all requirements');
            return;
        }

        setResetPasswordLoading(true);

        try {
            // Create a direct reset token for the logged-in user
            const tokenResponse = await axios.post(`${backendUrl}/api/user/create-reset-token`, {
                userId: userData._id
            }, { 
                headers: { token } 
            });

            if (tokenResponse.data.success && tokenResponse.data.resetToken) {
                // Use the token to reset the password
                const { data } = await axios.post(
                    `${backendUrl}/api/user/reset-password/${tokenResponse.data.resetToken}`, 
                    {
                        oldPassword,
                        newPassword,
                        confirmPassword
                    }
                );

                if (data.success) {
                    toast.success(data.message);
                    setShowResetPasswordModal(false);
                    resetPasswordForm();
                } else {
                    toast.error(data.message);
                }
            } else {
                toast.error(tokenResponse.data.message || 'Failed to create reset token');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            toast.error(error.response?.data?.message || 'An error occurred');
        } finally {
            setResetPasswordLoading(false);
        }
    };

    // Reset the password form
    const resetPasswordForm = () => {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowOldPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setPasswordStrength({
            isValid: false,
            hasMinLength: false,
            hasLetter: false,
            hasNumber: false
        });
    };

    return userData ? (
        <div className='max-w-lg flex flex-col gap-2 text-sm pt-5'>

            {isEdit
                ? <label htmlFor='image' >
                    <div className='inline-block relative cursor-pointer'>
                        <img className='w-36 rounded opacity-75' src={image ? URL.createObjectURL(image) : userData.image} alt="" />
                        <img className='w-10 absolute bottom-12 right-12' src={image ? '' : assets.upload_icon} alt="" />
                    </div>
                    <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
                </label>
                : <img className='w-36 rounded' src={userData.image} alt="" />
            }

            {isEdit
                ? <div className='flex gap-2'>
                    <input 
                      className='bg-gray-50 text-3xl font-medium max-w-40' 
                      type="text" 
                      onChange={(e) => setUserData(prev => ({ ...prev, firstName: e.target.value }))} 
                      value={userData.firstName} 
                      placeholder="First Name"
                    />
                    <input 
                      className='bg-gray-50 text-3xl font-medium max-w-40' 
                      type="text" 
                      onChange={(e) => setUserData(prev => ({ ...prev, lastName: e.target.value }))} 
                      value={userData.lastName} 
                      placeholder="Last Name"
                    />
                  </div>
                : <p className='font-medium text-3xl text-[#262626] mt-4'>{userData.firstName} {userData.lastName}</p>
            }

            <hr className='bg-[#ADADAD] h-[1px] border-none' />

            <div>
                <p className='text-gray-600 underline mt-3'>CONTACT INFORMATION</p>
                <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-[#363636]'>
                    <p className='font-medium'>Email id:</p>
                    <p className='text-blue-500'>{userData.email}</p>
                    <p className='font-medium'>Phone:</p>

                    {isEdit
                        ? <input className='bg-gray-50 max-w-52' type="text" onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))} value={userData.phone} />
                        : <p className='text-blue-500'>{userData.phone}</p>
                    }

                    <p className='font-medium'>Address:</p>

                    {isEdit
                        ? <p>
                            <input className='bg-gray-50' type="text" onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))} value={userData.address.line1} />
                            <br />
                            <input className='bg-gray-50' type="text" onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))} value={userData.address.line2} /></p>
                        : <p className='text-gray-500'>{userData.address.line1} <br /> {userData.address.line2}</p>
                    }

                </div>
            </div>
            <div>
                <p className='text-[#797979] underline mt-3'>BASIC INFORMATION</p>
                <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-gray-600'>
                    <p className='font-medium'>Gender:</p>

                    {isEdit
                        ? <select className='max-w-20 bg-gray-50' onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))} value={userData.gender} >
                            <option value="Not Selected">Not Selected</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        : <p className='text-gray-500'>{userData.gender}</p>
                    }

                    <p className='font-medium'>Birthday:</p>

                    {isEdit
                        ? <input className='max-w-28 bg-gray-50' type='date' onChange={(e) => setUserData(prev => ({ ...prev, dob: e.target.value }))} value={userData.dob} />
                        : <p className='text-gray-500'>{userData.dob}</p>
                    }

                </div>
            </div>
            <div className='mt-10 flex gap-4'>
                {isEdit
                    ? <button onClick={updateUserProfileData} className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all'>Save information</button>
                    : (
                        <>
                            <button onClick={() => setIsEdit(true)} className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all'>Edit</button>
                            <button 
                                onClick={() => setShowResetPasswordModal(true)} 
                                className='border border-orange-500 px-8 py-2 rounded-full hover:bg-orange-500 hover:text-white transition-all'
                            >
                                Reset Password
                            </button>
                        </>
                    )
                }
            </div>

            {/* Reset Password Modal */}
            {showResetPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-semibold mb-4">Reset Password</h2>
                        <p className="text-gray-600 mb-6">Please enter your current password and create a new password.</p>
                        
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Current Password</label>
                            <div className="relative">
                                <input 
                                    type={showOldPassword ? "text" : "password"} 
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="Enter your current password"
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
                        
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">New Password</label>
                            <div className="relative">
                                <input 
                                    type={showNewPassword ? "text" : "password"} 
                                    value={newPassword}
                                    onChange={handlePasswordChange}
                                    className={`w-full p-2 border rounded ${
                                        newPassword && !passwordStrength.isValid 
                                            ? 'border-orange-400' 
                                            : 'border-gray-300'
                                    }`}
                                    placeholder="Create a new password"
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
                        
                        <div className="mb-6">
                            <label className="block text-gray-700 mb-2">Confirm New Password</label>
                            <div className="relative">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={`w-full p-2 border rounded ${
                                        newPassword && confirmPassword && newPassword !== confirmPassword 
                                            ? 'border-red-500' 
                                            : 'border-gray-300'
                                    }`}
                                    placeholder="Confirm your new password"
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
                        
                        <div className="flex justify-end gap-4">
                            <button 
                                onClick={() => {
                                    setShowResetPasswordModal(false);
                                    resetPasswordForm();
                                }}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleResetPassword}
                                disabled={resetPasswordLoading}
                                className={`px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark ${
                                    resetPasswordLoading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                            >
                                {resetPasswordLoading ? 'Processing...' : 'Reset Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    ) : null
}

export default MyProfile