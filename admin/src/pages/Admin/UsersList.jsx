import React, { useState, useEffect } from 'react';
import { Table, Button, message, Modal, Input, Space, Popconfirm, Image, Tooltip, Typography, Badge, Statistic, Card } from 'antd';
import { SearchOutlined, DeleteOutlined, EyeOutlined, BlockOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';

const UsersList = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [blockModalVisible, setBlockModalVisible] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    const [appointmentStats, setAppointmentStats] = useState({});
    const [statsLoading, setStatsLoading] = useState(false);
    const [statsModalVisible, setStatsModalVisible] = useState(false);
    const [selectedUserStats, setSelectedUserStats] = useState(null);
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
                // Get the users from response
                const receivedUsers = response.data.users;
                
                // Log the first user to check timestamp fields
                if (receivedUsers.length > 0) {
                    console.log('First user data sample:', receivedUsers[0]);
                }
                
                // Sort users by createdAt or updatedAt in descending order (newest first)
                const sortedUsers = [...receivedUsers].sort((a, b) => {
                    // Try different timestamp fields that might exist
                    const aDate = a.createdAt || a.updatedAt || a.date || 0;
                    const bDate = b.createdAt || b.updatedAt || b.date || 0;
                    
                    // Convert to dates and compare (newer dates first)
                    return new Date(bDate) - new Date(aDate);
                });
                
                setUsers(sortedUsers);
                setFilteredUsers(sortedUsers);
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

    const fetchAppointmentStats = async () => {
        try {
            setStatsLoading(true);
            const response = await axios.get('/api/admin/users-appointment-stats', {
                headers: {
                    Authorization: `Bearer ${aToken}`
                }
            });
            
            if (response.data.success) {
                setAppointmentStats(response.data.userStats);
            } else {
                message.error(response.data.message || 'Failed to fetch appointment statistics');
            }
        } catch (error) {
            console.error('Error fetching appointment stats:', error);
            message.error(error.response?.data?.message || 'Failed to fetch appointment statistics');
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        if (aToken) {
            fetchUsers();
            fetchAppointmentStats();
        }
    }, [aToken]);

    // Safely filter users when search text changes
    const handleSearch = (value) => {
        setSearchText(value);
        if (!value.trim()) {
            setFilteredUsers(users);
            return;
        }
        
        const lowerCaseValue = value.toLowerCase().trim();
        const filtered = users.filter(user => {
            const firstName = user.firstName || '';
            const lastName = user.lastName || '';
            const email = user.email || '';
            
            return firstName.toLowerCase().includes(lowerCaseValue) ||
                   lastName.toLowerCase().includes(lowerCaseValue) ||
                   email.toLowerCase().includes(lowerCaseValue);
        });
        
        setFilteredUsers(filtered);
    };

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

    const handleDelete = async () => {
        try {
            const response = await axios.delete(
                `/api/admin/delete-user/${selectedUser._id}`,
                {
                    headers: {
                        Authorization: `Bearer ${aToken}`
                    }
                }
            );

            if (response.data.success) {
                message.success(response.data.message || 'User deleted successfully');
                fetchUsers();
                setDeleteModalVisible(false);
            } else {
                message.error(response.data.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            message.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const showBlockModal = (user) => {
        setSelectedUser(user);
        setBlockModalVisible(true);
    };

    const showDeleteModal = (user) => {
        setSelectedUser(user);
        setDeleteModalVisible(true);
    };

    const handlePreviewImage = (imageUrl) => {
        setPreviewImage(imageUrl);
        setImagePreviewVisible(true);
    };

    const showStatsModal = (user) => {
        setSelectedUser(user);
        const userStats = appointmentStats[user._id] || { total: 0, approved: 0, pending: 0, cancelled: 0 };
        setSelectedUserStats(userStats);
        setStatsModalVisible(true);
    };

    const columns = [
        {
            title: 'First Name',
            dataIndex: 'firstName',
            key: 'firstName',
            sorter: (a, b) => (a.firstName || '').localeCompare(b.firstName || ''),
        },
        {
            title: 'Last Name',
            dataIndex: 'lastName',
            key: 'lastName',
            sorter: (a, b) => (a.lastName || '').localeCompare(b.lastName || ''),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (email) => email || 'N/A',
        },
        {
            title: 'Status',
            dataIndex: 'approval_status',
            key: 'approval_status',
            filters: [
                { text: 'Approved', value: 'approved' },
                { text: 'Pending', value: 'pending' },
                { text: 'Declined', value: 'declined' },
                { text: 'Blocked', value: 'blocked' },
            ],
            onFilter: (value, record) => record.approval_status === value,
            render: (status) => (
                <span style={{ 
                    color: status === 'approved' ? 'green' : 
                           status === 'blocked' ? 'red' : 
                           status === 'pending' ? 'orange' : 'black'
                }}>
                    {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
                </span>
            )
        },
        {
            title: 'Appointments',
            key: 'appointments',
            render: (_, user) => {
                const stats = appointmentStats[user._id] || { total: 0 };
                return (
                    <Space>
                        <Badge count={stats.total || 0} showZero>
                            <Button 
                                icon={<CalendarOutlined />} 
                                onClick={() => showStatsModal(user)}
                                type="default"
                            >
                                Details
                            </Button>
                        </Badge>
                    </Space>
                );
            },
            sorter: (a, b) => {
                const aStats = appointmentStats[a._id] || { total: 0 };
                const bStats = appointmentStats[b._id] || { total: 0 };
                return aStats.total - bStats.total;
            },
        },
        {
            title: 'Valid ID',
            key: 'validId',
            render: (_, user) => (
                user.validId ? (
                    <Tooltip title="View ID">
                        <Button 
                            type="text" 
                            icon={<EyeOutlined />} 
                            onClick={() => handlePreviewImage(user.validId)}
                        />
                    </Tooltip>
                ) : (
                    <Typography.Text type="secondary">N/A</Typography.Text>
                )
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, user) => (
                <Space>
                    <Tooltip title="Block User">
                        <Button 
                            type="primary" 
                            danger 
                            icon={<BlockOutlined />}
                            onClick={() => showBlockModal(user)}
                            disabled={user.approval_status === 'blocked'}
                        />
                    </Tooltip>
                    <Tooltip title="Delete User">
                        <Button 
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => showDeleteModal(user)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Users List</h1>
                <Space>
                    <Input
                        placeholder="Search users by name or email"
                        value={searchText}
                        onChange={e => handleSearch(e.target.value)}
                        prefix={<SearchOutlined />}
                        style={{ width: 300 }}
                        allowClear
                    />
                </Space>
            </div>
            
            <Table 
                columns={columns} 
                dataSource={filteredUsers} 
                loading={loading || statsLoading}
                rowKey="_id"
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: 'No users found' }}
                defaultSortOrder="descend"
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

            <Modal
                title="Delete User"
                open={deleteModalVisible}
                onOk={handleDelete}
                onCancel={() => setDeleteModalVisible(false)}
                okText="Delete"
                cancelText="Cancel"
            >
                <p>Are you sure you want to delete this user? This action cannot be undone.</p>
                <p>Name: {selectedUser?.firstName} {selectedUser?.lastName}</p>
                <p>Email: {selectedUser?.email}</p>
            </Modal>

            <Modal
                open={imagePreviewVisible}
                footer={null}
                onCancel={() => setImagePreviewVisible(false)}
                width={800}
            >
                <Image
                    alt="Valid ID"
                    style={{ width: '100%' }}
                    src={previewImage}
                />
            </Modal>

            <Modal
                title={`Appointment Statistics: ${selectedUser?.firstName || ''} ${selectedUser?.lastName || ''}`}
                open={statsModalVisible}
                footer={null}
                onCancel={() => setStatsModalVisible(false)}
                width={600}
            >
                <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 20 }}>
                    <Card style={{ width: 120 }}>
                        <Statistic 
                            title="Total" 
                            value={selectedUserStats?.total || 0} 
                            prefix={<CalendarOutlined />} 
                        />
                    </Card>
                    <Card style={{ width: 120, backgroundColor: '#f6ffed' }}>
                        <Statistic 
                            title="Approved" 
                            value={selectedUserStats?.approved || 0} 
                            prefix={<CheckCircleOutlined style={{ color: 'green' }} />} 
                            valueStyle={{ color: 'green' }}
                        />
                    </Card>
                    <Card style={{ width: 120, backgroundColor: '#fffbe6' }}>
                        <Statistic 
                            title="Pending" 
                            value={selectedUserStats?.pending || 0} 
                            prefix={<ClockCircleOutlined style={{ color: 'orange' }} />} 
                            valueStyle={{ color: 'orange' }}
                        />
                    </Card>
                    <Card style={{ width: 120, backgroundColor: '#fff1f0' }}>
                        <Statistic 
                            title="Cancelled" 
                            value={selectedUserStats?.cancelled || 0} 
                            prefix={<CloseCircleOutlined style={{ color: 'red' }} />} 
                            valueStyle={{ color: 'red' }}
                        />
                    </Card>
                </div>
                <div style={{ marginTop: 30, textAlign: 'center' }}>
                    <Typography.Text type="secondary">
                        These statistics show the number of appointments booked by this user.
                    </Typography.Text>
                </div>
            </Modal>
        </div>
    );
};

export default UsersList;
