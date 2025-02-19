import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const AdminAnalytics = () => {
  const { appointments, doctors, aToken, getAllAppointments, getAllDoctors, dashData, getDashData } = useContext(AdminContext);
  const [analytics, setAnalytics] = useState({
    systemStats: {},
    appointmentTrends: [],
    doctorPerformance: [],
    specialtyDistribution: [],
    appointmentTimeDistribution: []
  });

  useEffect(() => {
    const fetchData = async () => {
      if (aToken) {
        await Promise.all([
          getAllAppointments(),
          getAllDoctors(),
          getDashData()
        ]);
      }
    };
    fetchData();
  }, [aToken]);

  useEffect(() => {
    if (appointments?.length >= 0 && doctors?.length >= 0 && dashData) {
      processAnalytics();
    }
  }, [appointments, doctors, dashData]);

  const processAnalytics = () => {
    // System-wide statistics
    const systemStats = {
      totalAppointments: appointments?.length || 0,
      totalDoctors: doctors?.length || 0,
      totalPatients: dashData?.patients || 0,
      completedAppointments: appointments?.filter(app => app.isCompleted)?.length || 0,
      cancelledAppointments: appointments?.filter(app => app.cancelled)?.length || 0,
      activeAppointments: appointments?.filter(app => !app.isCompleted && !app.cancelled)?.length || 0
    };

    // Process appointment trends for last 7 days
    const appointmentsByDay = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'yyyy-MM-dd');
    }).reverse();

    last7Days.forEach(day => {
      const dayAppointments = appointments?.filter(app => 
        format(new Date(parseInt(app.date)), 'yyyy-MM-dd') === day
      ) || [];
      
      appointmentsByDay[day] = {
        total: dayAppointments.length,
        completed: dayAppointments.filter(app => app.isCompleted).length,
        cancelled: dayAppointments.filter(app => app.cancelled).length
      };
    });

    const appointmentTrends = Object.entries(appointmentsByDay).map(([date, stats]) => ({
      date: format(parseISO(date), 'MMM dd'),
      total: stats.total,
      completed: stats.completed,
      cancelled: stats.cancelled
    }));

    // Process doctor performance using appointments data
    const doctorStats = appointments.reduce((acc, app) => {
      const docId = app.docId;
      if (!acc[docId]) {
        const doctor = app.docData || {};
        acc[docId] = {
          name: doctor.name || 'Unknown',
          specialization: doctor.specialization || doctor.speciality || 'General',
          completed: 0,
          cancelled: 0,
          pending: 0,
          total: 0
        };
      }
      acc[docId].total++;
      if (app.isCompleted) acc[docId].completed++;
      else if (app.cancelled) acc[docId].cancelled++;
      else acc[docId].pending++;
      return acc;
    }, {});

    const doctorPerformance = Object.values(doctorStats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // Process specialty distribution from appointments
    const specialtyCount = {};
    appointments.forEach(app => {
      const specialty = app.docData?.specialization || app.docData?.speciality || 'General';
      specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1;
    });

    const specialtyDistribution = Object.entries(specialtyCount)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.name !== 'undefined' && item.name !== 'null');

    // Process appointment time distribution
    const timeSlots = appointments?.reduce((acc, app) => {
      const time = app.slotTime;
      if (time) {
        acc[time] = (acc[time] || 0) + 1;
      }
      return acc;
    }, {}) || {};

    const appointmentTimeDistribution = Object.entries(timeSlots)
      .map(([time, count]) => ({
        time,
        count
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    setAnalytics({
      systemStats,
      appointmentTrends,
      doctorPerformance,
      specialtyDistribution,
      appointmentTimeDistribution
    });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const exportChartsToPDF = async () => {
    const chartsContainer = document.getElementById('charts-container');
    if (!chartsContainer) return;

    // Create PDF in landscape orientation for better chart layout
    const pdf = new jsPDF('l', 'mm', 'a4');
    
    // A4 landscape dimensions (297 x 210 mm)
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 10;

    // Add title centered at the top
    pdf.setFontSize(16);
    pdf.text('System Analytics Dashboard Report', pageWidth / 2, margin, { align: 'center' });
    
    // Add date and system stats under the title
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${format(new Date(), 'PPP')}`, pageWidth / 2, margin + 7, { align: 'center' });
    
    // Add system stats as a summary
    const stats = [
      `Total Doctors: ${analytics.systemStats.totalDoctors}`,
      `Total Patients: ${analytics.systemStats.totalPatients}`,
      `Total Appointments: ${analytics.systemStats.totalAppointments}`,
      `Approved: ${analytics.systemStats.completedAppointments}`,
      `Active: ${analytics.systemStats.activeAppointments}`,
      `Cancelled: ${analytics.systemStats.cancelledAppointments}`
    ];
    
    // Layout stats in two rows
    const statsPerRow = 3;
    stats.forEach((stat, index) => {
      const row = Math.floor(index / statsPerRow);
      const col = index % statsPerRow;
      const x = margin + (col * ((pageWidth - (margin * 2)) / statsPerRow));
      pdf.text(stat, x, margin + 15 + (row * 5));
    });

    // Calculate dimensions for 2x2 grid layout
    const chartWidth = (pageWidth - (margin * 3)) / 2;
    const chartHeight = (pageHeight - (margin * 4) - 30) / 2; // Reduced height to accommodate stats

    // Get all chart containers
    const chartDivs = Array.from(chartsContainer.querySelectorAll('.chart-container'));
    
    // Define positions for each chart
    const positions = [
      { x: margin, y: margin + 30 }, // Top left
      { x: margin + chartWidth + margin, y: margin + 30 }, // Top right
      { x: margin, y: margin + chartHeight + margin + 30 }, // Bottom left
      { x: margin + chartWidth + margin, y: margin + chartHeight + margin + 30 } // Bottom right
    ];

    // Capture and add each chart
    for (let i = 0; i < chartDivs.length; i++) {
      const canvas = await html2canvas(chartDivs[i], {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(
        imgData,
        'PNG',
        positions[i].x,
        positions[i].y,
        chartWidth,
        chartHeight
      );

      // Add chart title
      const titleElement = chartDivs[i].querySelector('h3');
      if (titleElement) {
        pdf.setFontSize(10);
        pdf.text(
          titleElement.textContent,
          positions[i].x + (chartWidth / 2),
          positions[i].y - 2,
          { align: 'center' }
        );
      }
    }

    pdf.save('system-analytics-report.pdf');
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">System Analytics Dashboard</h2>
        <button
          onClick={exportChartsToPDF}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow transition-colors"
        >
          Export Charts to PDF
        </button>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Doctors</h3>
          <p className="text-2xl font-semibold">{analytics.systemStats.totalDoctors}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Patients</h3>
          <p className="text-2xl font-semibold">{analytics.systemStats.totalPatients}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Appointments</h3>
          <p className="text-2xl font-semibold">{analytics.systemStats.totalAppointments}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Approved</h3>
          <p className="text-2xl font-semibold text-green-600">
            {analytics.systemStats.completedAppointments}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Active</h3>
          <p className="text-2xl font-semibold text-blue-600">
            {analytics.systemStats.activeAppointments}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Cancelled</h3>
          <p className="text-2xl font-semibold text-red-600">
            {analytics.systemStats.cancelledAppointments}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div id="charts-container" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Trends */}
        <div className="bg-white p-4 rounded-lg shadow chart-container">
          <h3 className="text-lg font-semibold mb-4">Appointment Trends (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.appointmentTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="total" name="Total" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              <Area type="monotone" dataKey="completed" name="Approved" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
              <Area type="monotone" dataKey="cancelled" name="Cancelled" stroke="#ff8042" fill="#ff8042" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Time Slot Distribution */}
        <div className="bg-white p-4 rounded-lg shadow chart-container">
          <h3 className="text-lg font-semibold mb-4">Appointment Time Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.appointmentTimeDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Appointments" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Doctor Performance */}
        <div className="bg-white p-4 rounded-lg shadow chart-container">
          <h3 className="text-lg font-semibold mb-4">Top Doctors by Appointments</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.doctorPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" name="Approved" stackId="a" fill="#82ca9d" />
              <Bar dataKey="pending" name="Pending" stackId="a" fill="#8884d8" />
              <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill="#ff8042" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Specialty Distribution */}
        <div className="bg-white p-4 rounded-lg shadow chart-container">
          <h3 className="text-lg font-semibold mb-4">Specialty Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.specialtyDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.specialtyDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
