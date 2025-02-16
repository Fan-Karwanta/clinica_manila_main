import React, { useEffect, useState, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';

const PendingRegistrations = () => {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { backendUrl, aToken } = useContext(AdminContext);

    const fetchPendingRegistrations = async () => {
        try {
            setLoading(true);
            console.log('Fetching pending registrations...');
            const response = await axios.get(`${backendUrl}/api/admin/pending-registrations`, {
                headers: { aToken }
            });
            console.log('Response:', response.data);
            
            if (response.data.success) {
                setPendingUsers(response.data.pendingUsers || []);
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

    const handleApproval = async (userId, status) => {
        if (!window.confirm(`Are you sure you want to ${status} this user?`)) {
            return;
        }

        try {
            setLoading(true);
            const response = await axios.put(
                `${backendUrl}/api/admin/update-approval/${userId}`,
                { status },
                { headers: { aToken } }
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

    useEffect(() => {
        fetchPendingRegistrations();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[80vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <img src={assets.people_icon} alt="" className="w-6" />
                    <h2 className="text-2xl font-semibold">Pending Registrations</h2>
                </div>
                <button 
                    onClick={fetchPendingRegistrations}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-opacity-90"
                    disabled={loading}
                >
                    {/*<img src={assets.refresh_icon} alt="" className="w-4 h-4" />*/}
                    Refresh
                </button>
            </div>
            
            {pendingUsers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                   
                    <p className="text-gray-500 text-lg">No pending registrations found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingUsers.map((user) => (
                        <div key={user._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <div className="p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-full">
                                        <div className="mb-2">
                                            <span className="text-gray-600">Last Name: </span>
                                            <span className="font-semibold">{user.lastName}</span>
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-gray-600">First Name: </span>
                                            <span className="font-semibold">{user.firstName}</span>
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-gray-600">Middle Name: </span>
                                            <span className="font-semibold">{user.middleName || 'N/A'}</span>
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-gray-600">Date of Birth : </span>
                                            <span className="font-semibold">{user.dob || 'N/A'}</span>
                                        </div>
                                        <br />
                                        <div className="mb-2">
                                            <span className="text-gray-600">Email: </span>
                                            <span className="font-semibold">{user.email || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mb-4">
                                    <p className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                                        <span className="text-gray-600">Valid ID:</span>
                                    </p>
                                    <div className="w-full h-[300px] rounded-md overflow-hidden">
                                        {user.validId ? (
                                            <img 
                                                src={user.validId} 
                                                alt="Valid ID" 
                                                className="w-full h-full object-contain bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => window.open(user.validId, '_blank')}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                <p className="text-gray-500">No ID uploaded</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleApproval(user._id, 'approved')}
                                        className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                        disabled={loading}
                                    >
                                        
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleApproval(user._id, 'declined')}
                                        className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                        disabled={loading}
                                    >
                                        
                                        Decline
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingRegistrations;
