import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';

const DoctorAnalytics = () => {
  const { appointments, dToken, getAppointments } = useContext(DoctorContext);
  const [analytics, setAnalytics] = useState({
    statusDistribution: [],
    returnRateData: [],
    appointmentTrends: [],
    timeDistribution: []
  });

  useEffect(() => {
    if (dToken) {
      getAppointments();
    }
  }, [dToken]);

  useEffect(() => {
    if (appointments.length > 0) {
      processAnalytics();
    }
  }, [appointments]);

  const processAnalytics = () => {
    // Process status distribution
    const statusCount = {
      completed: appointments.filter(app => app.isCompleted).length,
      cancelled: appointments.filter(app => app.cancelled).length,
      pending: appointments.filter(app => !app.isCompleted && !app.cancelled).length
    };

    const statusDistribution = [
      { name: 'Approved', value: statusCount.completed },
      { name: 'Cancelled', value: statusCount.cancelled },
      { name: 'Pending', value: statusCount.pending }
    ];

    // Process patient return rate
    const patientVisits = appointments.reduce((acc, app) => {
      const patientId = app.userId;
      acc[patientId] = (acc[patientId] || 0) + 1;
      return acc;
    }, {});

    const returnRateData = [
      { name: 'First-time Patients', value: Object.values(patientVisits).filter(visits => visits === 1).length },
      { name: 'Returning Patients', value: Object.values(patientVisits).filter(visits => visits > 1).length }
    ];

    // Process appointment trends
    const appointmentsByDay = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    last7Days.forEach(day => {
      appointmentsByDay[day] = appointments.filter(app => 
        format(new Date(parseInt(app.date)), 'yyyy-MM-dd') === day
      ).length;
    });

    const appointmentTrends = Object.entries(appointmentsByDay).map(([date, count]) => ({
      date: format(parseISO(date), 'MMM dd'),
      appointments: count
    }));

    // Process time distribution
    const timeSlots = appointments.reduce((acc, app) => {
      const time = app.slotTime;
      acc[time] = (acc[time] || 0) + 1;
      return acc;
    }, {});

    const timeDistribution = Object.entries(timeSlots)
      .map(([time, count]) => ({
        time,
        appointments: count
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    setAnalytics({
      statusDistribution,
      returnRateData,
      appointmentTrends,
      timeDistribution
    });
  };

  const COLORS = ['#0088FE', '#FF8042', '#FFBB28'];
  const RETURN_COLORS = ['#00C49F', '#0088FE'];

  return (
    <div className="w-full max-w-6xl m-5 space-y-6">
      <h2 className="text-2xl font-semibold mb-6">Analytics Dashboard</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Appointments</h3>
          <p className="text-2xl font-semibold">{appointments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Approved</h3>
          <p className="text-2xl font-semibold text-green-600">
            {appointments.filter(app => app.isCompleted).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Cancelled</h3>
          <p className="text-2xl font-semibold text-red-600">
            {appointments.filter(app => app.cancelled).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Active Patients</h3>
          <p className="text-2xl font-semibold">
            {new Set(appointments.map(app => app.userId)).size}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Appointment Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Patient Return Rate */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Patient Return Rate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.returnRateData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.returnRateData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RETURN_COLORS[index % RETURN_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Appointment Trends */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Appointment Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.appointmentTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="appointments" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Time Distribution */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Appointment Time Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.timeDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="appointments" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DoctorAnalytics;
