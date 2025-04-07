import axios from "axios";
import { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

export const AdminContext = createContext()

const AdminContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [aToken, setAToken] = useState(localStorage.getItem('aToken') || '')
    const [pendingRegistrations, setPendingRegistrations] = useState([]);
    const [loading, setLoading] = useState(false);

    const [appointments, setAppointments] = useState([])
    const [doctors, setDoctors] = useState([])
    const [dashData, setDashData] = useState(false)

    // Initialize token from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem('aToken');
        if (storedToken) {
            setAToken(storedToken);
        }
    }, []);

    // Configure axios defaults when token changes
    useEffect(() => {
        if (aToken) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${aToken}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [aToken]);

    const fetchPendingRegistrations = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${backendUrl}/api/admin/pending-registrations`, {
                headers: {
                    Authorization: `Bearer ${aToken}`
                }
            });
            
            if (response.data.success) {
                setPendingRegistrations(response.data.pendingUsers || []);
            } else {
                toast.error(response.data.message || 'Failed to fetch pending registrations');
            }
        } catch (error) {
            console.error('Error fetching pending registrations:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch pending registrations');
        } finally {
            setLoading(false);
        }
    };

    const updateApprovalStatus = async (userId, status) => {
        try {
            setLoading(true);
            const response = await axios.put(
                `${backendUrl}/api/admin/update-approval/${userId}`,
                { status },
                {
                    headers: {
                        Authorization: `Bearer ${aToken}`
                    }
                }
            );
            
            if (response.data.success) {
                toast.success(`User registration ${status} successfully`);
                await fetchPendingRegistrations();
            } else {
                toast.error(response.data.message || 'Failed to update registration status');
            }
        } catch (error) {
            console.error('Error updating registration status:', error);
            toast.error(error.response?.data?.message || 'Failed to update registration status');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('aToken');
        setAToken('');
    };

    useEffect(() => {
        if (aToken) {
            fetchPendingRegistrations();
        }
    }, [aToken]);

    // Getting all Doctors data from Database using API
    const getAllDoctors = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/all-doctors', { headers: { Authorization: `Bearer ${aToken}` } })
            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }

    }

    // Function to get a single doctor by ID
    const getDoctorById = async (doctorId) => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/admin/doctor/${doctorId}`, { 
                headers: { Authorization: `Bearer ${aToken}` } 
            })
            
            if (data.success) {
                return data.doctor
            } else {
                toast.error(data.message)
                return null
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
            return null
        }
    }

    // Function to update doctor
    const updateDoctor = async (doctorId, formData) => {
        try {
            const { data } = await axios.put(`${backendUrl}/api/admin/update-doctor/${doctorId}`, 
                formData, 
                { headers: { 
                    Authorization: `Bearer ${aToken}`,
                    'Content-Type': 'multipart/form-data'
                }}
            )
            
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
                return true
            } else {
                toast.error(data.message)
                return false
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
            return false
        }
    }

    // Function to delete doctor
    const deleteDoctor = async (doctorId) => {
        try {
            const { data } = await axios.delete(`${backendUrl}/api/admin/delete-doctor/${doctorId}`, { 
                headers: { Authorization: `Bearer ${aToken}` } 
            })
            
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
                return true
            } else {
                toast.error(data.message)
                return false
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
            return false
        }
    }

    // Function to change doctor availablity using API
    const changeAvailability = async (docId) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/change-availability', { docId }, { headers: { Authorization: `Bearer ${aToken}` } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Getting all appointment data from Database using API
    const getAllAppointments = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/appointments', { headers: { Authorization: `Bearer ${aToken}` } })
            if (data.success) {
                setAppointments(data.appointments.reverse())
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // Function to cancel appointment using API
    const cancelAppointment = async (appointmentId, cancellationReason) => {
        try {
            const { data } = await axios.put(
                `${backendUrl}/api/admin/appointment-cancel/${appointmentId}`,
                { cancellationReason },
                { headers: { Authorization: `Bearer ${aToken}` } }
            );

            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    // Getting Admin Dashboard data from Database using API
    const getDashData = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/admin/dashboard', { headers: { Authorization: `Bearer ${aToken}` } })

            if (data.success) {
                setDashData(data.dashData)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }

    }

    const value = {
        backendUrl,
        aToken,
        setAToken,
        appointments,
        setAppointments,
        doctors,
        setDoctors,
        dashData,
        setDashData,
        pendingRegistrations,
        loading,
        fetchPendingRegistrations,
        updateApprovalStatus,
        handleLogout,
        getAllDoctors,
        getDoctorById,
        updateDoctor,
        deleteDoctor,
        changeAvailability,
        getAllAppointments,
        getDashData,
        cancelAppointment
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )

}

export default AdminContextProvider