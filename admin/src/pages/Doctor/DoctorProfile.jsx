import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const DoctorProfile = () => {
    const { dToken, profileData, setProfileData, getProfileData } = useContext(DoctorContext)
    const { currency, backendUrl } = useContext(AppContext)
    const [isEdit, setIsEdit] = useState(false)
    const [loading, setLoading] = useState(false)

    const updateProfile = async () => {
        try {
            setLoading(true)
            const updateData = {
                address: profileData.address,
                fees: profileData.fees,
                about: profileData.about,
                available: profileData.available
            }

            const { data } = await axios.post(backendUrl + '/api/doctor/update-profile', updateData, { headers: { dToken } })

            if (data.success) {
                toast.success(data.message)
                setIsEdit(false)
                getProfileData()
            } else {
                toast.error(data.message)
            }

            setIsEdit(false)
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (dToken) {
            getProfileData()
        }
    }, [dToken])

    const cancelEdit = () => {
        getProfileData() // Reset to original data
        setIsEdit(false)
    }

    return profileData && (
        <div className="bg-gray-50 min-h-screen p-4">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Doctor Profile</h1>
                
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Header Section with Banner & Profile Photo */}
                    <div className="relative h-40 bg-gradient-to-r from-primary/80 to-blue-500/80">
                        <div className="absolute -bottom-16 left-8">
                            <div className="relative">
                                <img 
                                    className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-md" 
                                    src={profileData.image} 
                                    alt={`Dr. ${profileData.name}`}
                                />
                                <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white ${profileData.available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="pt-20 px-8 pb-8">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        Dr. {profileData.name} 
                                        {profileData.name_extension && <span className="text-lg font-medium text-gray-600">, {profileData.name_extension}</span>}
                                    </h2>
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${profileData.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {profileData.available ? 'Available' : 'Unavailable'}
                                    </span>
                                </div>
                                <div className="mt-1 flex items-center flex-wrap gap-3">
                                    <div className="text-gray-700 font-medium">{profileData.speciality}</div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                    <div className="text-gray-600">{profileData.degree}</div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                                    <div className="text-sm px-2 py-0.5 bg-gray-100 rounded-full text-gray-700">{profileData.experience}</div>
                                </div>
                            </div>
                            <div>
                                {isEdit ? (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={cancelEdit}
                                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                                            disabled={loading}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={updateProfile}
                                            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2"
                                            disabled={loading}
                                        >
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setIsEdit(true)}
                                        className="px-4 py-2 text-sm border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                            {/* Left Column - Personal Info */}
                            <div className="md:col-span-2 space-y-6">
                                <div className="space-y-3">
                                    <h3 className="text-lg font-medium text-gray-800">About</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        {isEdit ? (
                                            <textarea 
                                                onChange={(e) => setProfileData(prev => ({ ...prev, about: e.target.value }))} 
                                                className="w-full outline-primary border border-gray-300 rounded-lg p-3 min-h-[150px]" 
                                                value={profileData.about} 
                                            />
                                        ) : (
                                            <p className="text-gray-700 whitespace-pre-wrap">{profileData.about}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <h3 className="text-lg font-medium text-gray-800">Qualifications</h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500">Degree</p>
                                                <p className="font-medium text-gray-700">{profileData.degree}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Speciality</p>
                                                <p className="font-medium text-gray-700">{profileData.speciality}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Experience</p>
                                                <p className="font-medium text-gray-700">{profileData.experience}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">License ID</p>
                                                <p className="font-medium text-gray-700">{profileData.doc_lic_ID}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Contact Info & Settings */}
                            <div className="space-y-6">
                                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                    <h3 className="text-lg font-medium text-gray-800">Contact Information</h3>
                                    
                                    <div>
                                        <p className="text-sm text-gray-500">Email Address</p>
                                        <p className="font-medium text-gray-700">{profileData.email}</p>
                                    </div>
                                    
                                    <div>
                                        <p className="text-sm text-gray-500">Address</p>
                                        {isEdit ? (
                                            <div className="space-y-2 mt-1">
                                                <input 
                                                    type="text" 
                                                    placeholder="Address Line 1"
                                                    className="w-full p-2 border border-gray-300 rounded"
                                                    value={profileData.address.line1} 
                                                    onChange={(e) => setProfileData(prev => ({ 
                                                        ...prev, 
                                                        address: { ...prev.address, line1: e.target.value }
                                                    }))}
                                                />
                                                <input 
                                                    type="text"
                                                    placeholder="Address Line 2"
                                                    className="w-full p-2 border border-gray-300 rounded"
                                                    value={profileData.address.line2}
                                                    onChange={(e) => setProfileData(prev => ({ 
                                                        ...prev, 
                                                        address: { ...prev.address, line2: e.target.value }
                                                    }))}
                                                />
                                            </div>
                                        ) : (
                                            <address className="not-italic text-gray-700">
                                                {profileData.address.line1}<br />
                                                {profileData.address.line2}
                                            </address>
                                        )}
                                    </div>
                                    {/*
                                    <div>
                                        <p className="text-sm text-gray-500">Consultation Fee</p>
                                        <p className="font-medium text-gray-700">{currency} {profileData.fees}</p>
                                    </div> */}
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="text-lg font-medium text-gray-800 mb-3">Availability Settings</h3>
                                    <div className="flex items-center">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={profileData.available}
                                                onChange={() => isEdit && setProfileData(prev => ({ 
                                                    ...prev, 
                                                    available: !prev.available 
                                                }))}
                                                disabled={!isEdit}
                                            />
                                            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer ${profileData.available ? 'peer-checked:bg-primary' : ''} after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full`}></div>
                                            <span className="ml-3 text-gray-700 text-sm font-medium">
                                                {profileData.available ? 'Available for Appointments' : 'Not Available'}
                                            </span>
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Toggle this setting to control your availability for new appointments.
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

export default DoctorProfile