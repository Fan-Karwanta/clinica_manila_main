import React, { useState, useEffect } from 'react';
import { Table, Button, message, Modal } from 'antd';
import axios from 'axios';
import { useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';

const UsersList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [blockModalVisible, setBlockModalVisible] = useState(false);
    const { aToken } = useContext(AdminContext);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/admin/users', {
                headers: {
                    Authorization: `Bearer ${aToken}`
                }
            });
            
            if (response.data.success) {
                setUsers(response.data.users);
            } else {
                message.error(response.data.message || 'Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            message.error(error.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (aToken) {
            fetchUsers();
        }
    }, [aToken]);

    const handleBlock = async () => {
        try {
            const response = await axios.put(
                `/api/admin/update-approval/${selectedUser._id}`, 
                { status: 'blocked' },
                {
                    headers: {
                        Authorization: `Bearer ${aToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                message.success(response.data.message || 'User blocked successfully');
                fetchUsers();
                setBlockModalVisible(false);
            } else {
                message.error(response.data.message || 'Failed to block user');
            }
        } catch (error) {
            console.error('Error blocking user:', error);
            message.error(error.response?.data?.message || 'Failed to block user');
        }
    };

    const showBlockModal = (user) => {
        setSelectedUser(user);
        setBlockModalVisible(true);
    };

    const columns = [
        {
            title: 'First Name',
            dataIndex: 'firstName',
            key: 'firstName',
        },
        {
            title: 'Last Name',
            dataIndex: 'lastName',
            key: 'lastName',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Status',
            dataIndex: 'approval_status',
            key: 'approval_status',
            render: (status) => (
                <span style={{ 
                    color: status === 'approved' ? 'green' : 
                           status === 'blocked' ? 'red' : 
                           status === 'pending' ? 'orange' : 'black'
                }}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, user) => (
                <Button 
                    type="primary" 
                    danger 
                    onClick={() => showBlockModal(user)}
                    disabled={user.approval_status === 'blocked'}
                >
                    Block
                </Button>
            ),
        },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <h1>Users List</h1>
            <Table 
                columns={columns} 
                dataSource={users} 
                loading={loading}
                rowKey="_id"
            />

            <Modal
                title="Block User"
                open={blockModalVisible}
                onOk={handleBlock}
                onCancel={() => setBlockModalVisible(false)}
                okText="Block"
                cancelText="Cancel"
            >
                <p>Are you sure you want to block this user?</p>
                <p>Name: {selectedUser?.firstName} {selectedUser?.lastName}</p>
                <p>Email: {selectedUser?.email}</p>
            </Modal>
        </div>
    );
};

export default UsersList;
