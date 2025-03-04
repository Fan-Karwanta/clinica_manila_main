import React, { useContext, useState, useEffect } from 'react'
import { assets } from '../../assets/assets'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { useParams, useNavigate } from 'react-router-dom'

const EditDoctor = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    const [docImg, setDocImg] = useState(false)
    const [imageUrl, setImageUrl] = useState('')
    const [name, setName] = useState('')
    const [nameExtension, setNameExtension] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordsMatch, setPasswordsMatch] = useState(true)
    const [showPassword, setShowPassword] = useState(false)
    const [experience, setExperience] = useState('1 Year')
    const [fees, setFees] = useState('')
    const [about, setAbout] = useState('')
    const [speciality, setSpeciality] = useState('Dermatologist')
    const [degree, setDegree] = useState('')
    const [address1, setAddress1] = useState('')
    const [address2, setAddress2] = useState('')
    const [docLicID, setDocLicID] = useState('')
    const [loading, setLoading] = useState(true)

    const { backendUrl } = useContext(AppContext)
    const { aToken, getDoctorById, updateDoctor } = useContext(AdminContext)

    // Load doctor data
    useEffect(() => {
        const fetchDoctor = async () => {
            if (!aToken || !id) return
            
            setLoading(true)
            try {
                const doctor = await getDoctorById(id)
                if (doctor) {
                    setName(doctor.name || '')
                    setNameExtension(doctor.name_extension || '')
                    setEmail(doctor.email || '')
                    setExperience(doctor.experience || '1 Year')
                    setFees(doctor.fees || '')
                    setAbout(doctor.about || '')
                    setSpeciality(doctor.speciality || 'Dermatologist')
                    setDegree(doctor.degree || '')
                    setAddress1(doctor.address?.line1 || '')
                    setAddress2(doctor.address?.line2 || '')
                    setDocLicID(doctor.doc_lic_ID || '')
                    setImageUrl(doctor.image || '')
                } else {
                    toast.error('Failed to load doctor data')
                    navigate('/doctor-list')
                }
            } catch (error) {
                console.error(error)
                toast.error('An error occurred while loading doctor data')
                navigate('/doctor-list')
            } finally {
                setLoading(false)
            }
        }
        
        fetchDoctor()
    }, [aToken, id, getDoctorById, navigate])

    // Check if passwords match whenever either password field changes
    useEffect(() => {
        if (password === '' && confirmPassword === '') {
            setPasswordsMatch(true);
        } else if (password !== '' && confirmPassword !== '') {
            setPasswordsMatch(password === confirmPassword);
        }
    }, [password, confirmPassword]);

    const onSubmitHandler = async (event) => {
        event.preventDefault()

        try {
            if (!passwordsMatch) {
                return toast.error('Passwords do not match')
            }

            const formData = new FormData();

            if (docImg) {
                formData.append('image', docImg)
            }
            
            formData.append('name', name)
            formData.append('name_extension', nameExtension)
            formData.append('email', email)
            if (password) {
                formData.append('password', password)
            }
            formData.append('experience', experience)
            formData.append('fees', Number(fees))
            formData.append('about', about)
            formData.append('speciality', speciality)
            formData.append('degree', degree)
            formData.append('address', JSON.stringify({ line1: address1, line2: address2 }))
            formData.append('doc_lic_ID', docLicID)

            const success = await updateDoctor(id, formData)
            if (success) {
                navigate('/doctor-list')
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword)
    }

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>
    }

    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full'>
            <div className="flex justify-between items-center mb-3">
                <p className='text-lg font-medium'>Edit Doctor</p>
                <button 
                    type="button"
                    onClick={() => navigate('/doctor-list')}
                    className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                    Back to Doctors List
                </button>
            </div>

            <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll'>
                <div className='flex items-center gap-4 mb-8 text-gray-500'>
                    <label htmlFor="doc-img">
                        <img className='w-16 h-16 object-cover bg-gray-100 rounded-full cursor-pointer' 
                            src={docImg ? URL.createObjectURL(docImg) : (imageUrl || assets.upload_area)} 
                            alt="" 
                        />
                    </label>
                    <input onChange={(e) => setDocImg(e.target.files[0])} type="file" name="" id="doc-img" hidden />
                    <p>Upload doctor <br /> picture</p>
                </div>

                <div className='flex flex-col lg:flex-row items-start gap-10 text-gray-600'>
                    <div className='w-full lg:flex-1 flex flex-col gap-4'>
                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Doctor Name</p>
                            <input onChange={e => setName(e.target.value)} value={name} className='border rounded px-3 py-2' type="text" placeholder='Name' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Name Extension (ENT, RN, etc.)</p>
                            <input onChange={e => setNameExtension(e.target.value)} value={nameExtension} className='border rounded px-3 py-2' type="text" placeholder='Name Extension' />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Doctor Email</p>
                            <input onChange={e => setEmail(e.target.value)} value={email} className='border rounded px-3 py-2' type="email" placeholder='Email' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Change Password (leave blank to keep current)</p>
                            <input 
                                onChange={e => setPassword(e.target.value)} 
                                value={password} 
                                className={`border rounded px-3 py-2 ${!passwordsMatch && password && confirmPassword ? 'border-red-500' : ''}`}
                                type={showPassword ? "text" : "password"} 
                                placeholder='New Password' 
                            />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Confirm Password</p>
                            <input 
                                onChange={e => setConfirmPassword(e.target.value)} 
                                value={confirmPassword} 
                                className={`border rounded px-3 py-2 ${!passwordsMatch && password && confirmPassword ? 'border-red-500' : ''}`}
                                type={showPassword ? "text" : "password"} 
                                placeholder='Confirm Password' 
                                disabled={!password}
                            />
                            {!passwordsMatch && password && confirmPassword && (
                                <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
                            )}
                        </div>

                        <div className='flex items-center gap-2 mt-1'>
                            <input 
                                type="checkbox" 
                                id="show-password" 
                                checked={showPassword}
                                onChange={togglePasswordVisibility}
                                className="cursor-pointer"
                            />
                            <label htmlFor="show-password" className="text-sm cursor-pointer">Show Password</label>
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>License ID Number</p>
                            <input onChange={e => setDocLicID(e.target.value)} value={docLicID} className='border rounded px-3 py-2' type="text" placeholder='License ID Number' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Experience</p>
                            <select onChange={e => setExperience(e.target.value)} value={experience} className='border rounded px-2 py-2' >
                                <option value="1 Year">1 Year</option>
                                <option value="2 Year">2 Years</option>
                                <option value="3 Year">3 Years</option>
                                <option value="4 Year">4 Years</option>
                                <option value="5 Year">5 Years</option>
                                <option value="6 Year">6 Years</option>
                                <option value="8 Year">8 Years</option>
                                <option value="9 Year">9 Years</option>
                                <option value="10 Year">10 Years</option>
                            </select>
                        </div>
                    </div>

                    <div className='w-full lg:flex-1 flex flex-col gap-4'>
                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Speciality</p>
                            <select onChange={e => setSpeciality(e.target.value)} value={speciality} className='border rounded px-2 py-2'>
                                <option value="Dermatologist">Dermatologist</option>
                                <option value="Internal_Medicine">Internal Medicine</option>
                                <option value="Cardiologist">Cardiologist</option>
                                <option value="Obgynecologist">Obgynecologist</option>
                                <option value="Ophthalmologist">Ophthalmologist</option>
                                <option value="Surgeon">Surgeon</option>
                                <option value="ENT">ENT</option>
                            </select>
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Degree</p>
                            <input onChange={e => setDegree(e.target.value)} value={degree} className='border rounded px-3 py-2' type="text" placeholder='Degree' required />
                        </div>

                        <div className='flex-1 flex flex-col gap-1'>
                            <p>Address</p>
                            <input onChange={e => setAddress1(e.target.value)} value={address1} className='border rounded px-3 py-2' type="text" placeholder='Address 1 (required)' required />
                            <input onChange={e => setAddress2(e.target.value)} value={address2} className='border rounded px-3 py-2' type="text" placeholder='Address 2 (optional)' />
                        </div>

                      {/*}  <div className='flex-1 flex flex-col gap-1'>
                            <p>Fees</p>
                            <input onChange={e => setFees(e.target.value)} value={fees} className='border rounded px-3 py-2' type="number" placeholder='Doctor fees' required />
                        </div> */}
                    </div>
                </div>

                <div>
                    <p className='mt-4 mb-2'>About Doctor</p>
                    <textarea onChange={e => setAbout(e.target.value)} value={about} className='w-full px-4 pt-2 border rounded' rows={5} placeholder='write about doctor'></textarea>
                </div>

                <button 
                    type='submit' 
                    className={`px-10 py-3 mt-4 text-white rounded-full ${
                        (!passwordsMatch && password && confirmPassword) 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-primary hover:bg-primary-dark'
                    }`}
                    disabled={!passwordsMatch && password && confirmPassword}
                >
                    Update Doctor
                </button>
            </div>
        </form>
    )
}

export default EditDoctor
