import React, { useContext, useEffect } from 'react';
import { AdminContext } from '../context/AdminContext';
import { toast } from 'react-toastify';

const PendingRegistrations = () => {
    const { 
        pendingRegistrations, 
        loading, 
        fetchPendingRegistrations, 
        updateRegistrationStatus 
    } = useContext(AdminContext);

    useEffect(() => {
        fetchPendingRegistrations();
    }, []);

    const handleStatusUpdate = async (userId, status) => {
        if (window.confirm(`Are you sure you want to ${status} this user?`)) {
            await updateRegistrationStatus(userId, status);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Pending Registrations</h2>
                <button 
                    onClick={() => fetchPendingRegistrations()}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Refresh
                </button>
            </div>
            
            {pendingRegistrations.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                    No pending registrations found
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingRegistrations.map((user) => (
                        <div key={user._id} className="border rounded-lg p-4 shadow-sm">
                            <div className="mb-4">
                                <h3 className="font-semibold text-lg">{user.name}</h3>
                                <p className="text-gray-600">{user.email}</p>
                            </div>
                            
                            <div className="mb-4">
                                <p className="text-sm text-gray-500 mb-2">Valid ID</p>
                                <img 
                                    src={user.validIdUrl} 
                                    alt="Valid ID" 
                                    className="w-full h-48 object-cover rounded-md"
                                    onClick={() => window.open(user.validIdUrl, '_blank')}
                                    style={{ cursor: 'pointer' }}
                                />
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleStatusUpdate(user._id, 'approved')}
                                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors"
                                >
                                    Approve
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusUpdate(user._id, 'declined')}
                                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
                                >
                                    Decline
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PendingRegistrations;
