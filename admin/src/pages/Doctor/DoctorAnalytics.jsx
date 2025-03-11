import React, { useContext, useEffect, useState } from 'react';
import { DoctorContext } from '../../context/DoctorContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import { format, subDays, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const DoctorAnalytics = () => {
  const { appointments, dToken, getAppointments } = useContext(DoctorContext);
  const [timeFrame, setTimeFrame] = useState('week'); // 'week', 'month', 'year'
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    statusDistribution: [],
    returnRateData: [],
    appointmentTrends: [],
    timeDistribution: [],
    performanceMetrics: []
  });

  useEffect(() => {
    if (dToken) {
      setIsLoading(true);
      getAppointments().finally(() => {
        setIsLoading(false);
      });
    }
  }, [dToken]);

  useEffect(() => {
    if (appointments.length > 0) {
      processAnalytics();
    }
  }, [appointments, timeFrame]);

  const processAnalytics = () => {
    // Get date range based on time frame
    let startDate;
    const today = new Date();
    
    switch (timeFrame) {
      case 'week':
        startDate = subDays(today, 6);
        break;
      case 'month':
        startDate = startOfMonth(today);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        startDate = subDays(today, 6);
    }

    // Filter appointments based on timeframe
    const filteredAppointments = appointments.filter(app => {
      const appDate = new Date(parseInt(app.date));
      return appDate >= startDate && appDate <= today;
    });

    // Process status distribution
    const statusCount = {
      completed: filteredAppointments.filter(app => app.isCompleted).length,
      cancelled: filteredAppointments.filter(app => app.cancelled).length,
      pending: filteredAppointments.filter(app => !app.isCompleted && !app.cancelled).length
    };

    const statusDistribution = [
      { name: 'Approved', value: statusCount.completed },
      { name: 'Cancelled', value: statusCount.cancelled },
      { name: 'Pending', value: statusCount.pending }
    ];

    // Process patient return rate
    const patientVisits = filteredAppointments.reduce((acc, app) => {
      const patientId = app.userId;
      acc[patientId] = (acc[patientId] || 0) + 1;
      return acc;
    }, {});

    const returnRateData = [
      { name: 'First-time', value: Object.values(patientVisits).filter(visits => visits === 1).length },
      { name: 'Returning', value: Object.values(patientVisits).filter(visits => visits > 1).length }
    ];

    // Process appointment trends
    let dateRange;
    let dateFormat;

    switch (timeFrame) {
      case 'week':
        dateRange = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
        dateFormat = 'EEE';
        break;
      case 'month':
        dateRange = eachDayOfInterval({ start: startDate, end: today });
        dateFormat = 'dd';
        break;
      case 'year':
        dateRange = Array.from({ length: 12 }, (_, i) => new Date(today.getFullYear(), i, 1));
        dateFormat = 'MMM';
        break;
      default:
        dateRange = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i));
        dateFormat = 'EEE';
    }

    const appointmentTrends = dateRange.map(date => {
      const count = filteredAppointments.filter(app => {
        const appDate = new Date(parseInt(app.date));
        if (timeFrame === 'year') {
          return appDate.getMonth() === date.getMonth() && appDate.getFullYear() === date.getFullYear();
        }
        return isSameDay(appDate, date);
      }).length;

      return {
        date: format(date, dateFormat),
        appointments: count,
        cancelled: filteredAppointments.filter(app => {
          const appDate = new Date(parseInt(app.date));
          if (timeFrame === 'year') {
            return app.cancelled && appDate.getMonth() === date.getMonth() && appDate.getFullYear() === date.getFullYear();
          }
          return app.cancelled && isSameDay(appDate, date);
        }).length,
        completed: filteredAppointments.filter(app => {
          const appDate = new Date(parseInt(app.date));
          if (timeFrame === 'year') {
            return app.isCompleted && appDate.getMonth() === date.getMonth() && appDate.getFullYear() === date.getFullYear();
          }
          return app.isCompleted && isSameDay(appDate, date);
        }).length
      };
    });

    // Process time distribution
    const timeSlots = filteredAppointments.reduce((acc, app) => {
      const time = app.slotTime;
      acc[time] = (acc[time] || 0) + 1;
      return acc;
    }, {});

    const timeDistribution = Object.entries(timeSlots)
      .map(([time, count]) => ({
        time,
        appointments: count
      }))
      .sort((a, b) => {
        // Convert time strings to comparable format
        const timeA = a.time.replace(/(AM|PM)/, ' $1');
        const timeB = b.time.replace(/(AM|PM)/, ' $1');
        return new Date(`2000/01/01 ${timeA}`) - new Date(`2000/01/01 ${timeB}`);
      });

    // Calculate performance metrics
    const totalAppointments = filteredAppointments.length;
    const completionRate = totalAppointments > 0 
      ? (statusCount.completed / totalAppointments) * 100 
      : 0;
    const cancellationRate = totalAppointments > 0 
      ? (statusCount.cancelled / totalAppointments) * 100 
      : 0;
      
    const performanceMetrics = [
      { name: 'Completion Rate', value: completionRate },
      { name: 'Cancellation Rate', value: cancellationRate },
    ];

    setAnalytics({
      statusDistribution,
      returnRateData,
      appointmentTrends,
      timeDistribution,
      performanceMetrics
    });
  };

  const COLORS = ['#4ade80', '#f87171', '#facc15'];
  const RETURN_COLORS = ['#60a5fa', '#4ade80'];

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
    pdf.text('Analytics Dashboard Report', pageWidth / 2, margin, { align: 'center' });
    
    // Add date under the title
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${format(new Date(), 'PPP')}`, pageWidth / 2, margin + 7, { align: 'center' });
    pdf.text(`Time period: ${timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)}`, pageWidth / 2, margin + 14, { align: 'center' });

    // Calculate dimensions for 2x2 grid layout
    const chartWidth = (pageWidth - (margin * 3)) / 2; // Width for each chart
    const chartHeight = (pageHeight - (margin * 4) - 20) / 2; // Height for each chart, leaving space for title

    // Get all chart containers
    const chartDivs = Array.from(chartsContainer.querySelectorAll('.chart-container'));
    
    // Define positions for each chart
    const positions = [
      { x: margin, y: margin + 20 }, // Top left
      { x: margin + chartWidth + margin, y: margin + 20 }, // Top right
      { x: margin, y: margin + chartHeight + margin + 20 }, // Bottom left
      { x: margin + chartWidth + margin, y: margin + chartHeight + margin + 20 } // Bottom right
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

    pdf.save(`doctor-analytics-report-${timeFrame}.pdf`);
  };

  return (
    <div className="bg-gray-50 min-h-screen py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
              <p className="mt-1 text-gray-600">
                Insights for {timeFrame === 'week' ? 'the last 7 days' : timeFrame === 'month' ? 'this month' : 'this year'}
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setTimeFrame('week')}
                  className={`px-4 py-2 text-sm font-medium ${
                    timeFrame === 'week'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setTimeFrame('month')}
                  className={`px-4 py-2 text-sm font-medium border-l border-gray-300 ${
                    timeFrame === 'month'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setTimeFrame('year')}
                  className={`px-4 py-2 text-sm font-medium border-l border-gray-300 ${
                    timeFrame === 'year'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Year
                </button>
              </div>
              <button
                onClick={exportChartsToPDF}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export PDF
              </button>
            </div>
          </div>
        </div>
      
        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Appointments</p>
                    <h3 className="mt-2 text-3xl font-bold text-gray-800">{appointments.length}</h3>
                    <div className="mt-1 flex items-center text-sm font-medium text-gray-500">
                      <span>All time</span>
                    </div>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Approved</p>
                    <h3 className="mt-2 text-3xl font-bold text-green-600">
                      {appointments.filter(app => app.isCompleted).length}
                    </h3>
                    <div className="mt-1 flex items-center text-sm">
                      <span className="text-green-600 font-medium">
                        {Math.round((appointments.filter(app => app.isCompleted).length / (appointments.length || 1)) * 100)}%
                      </span>
                      <span className="ml-1 text-gray-500">completion rate</span>
                    </div>
                  </div>
                  <div className="bg-green-100 p-3 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Cancelled</p>
                    <h3 className="mt-2 text-3xl font-bold text-red-600">
                      {appointments.filter(app => app.cancelled).length}
                    </h3>
                    <div className="mt-1 flex items-center text-sm">
                      <span className="text-red-600 font-medium">
                        {Math.round((appointments.filter(app => app.cancelled).length / (appointments.length || 1)) * 100)}%
                      </span>
                      <span className="ml-1 text-gray-500">cancellation rate</span>
                    </div>
                  </div>
                  <div className="bg-red-100 p-3 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Active Patients</p>
                    <h3 className="mt-2 text-3xl font-bold text-indigo-600">
                      {new Set(appointments.map(app => app.userId)).size}
                    </h3>
                    <div className="mt-1 flex items-center text-sm">
                      <span className="text-indigo-600 font-medium">
                        {analytics.returnRateData.length > 1 && analytics.returnRateData[1].value > 0
                          ? Math.round((analytics.returnRateData[1].value / (analytics.returnRateData[0].value + analytics.returnRateData[1].value)) * 100)
                          : 0}%
                      </span>
                      <span className="ml-1 text-gray-500">return rate</span>
                    </div>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 003 3h-10a3 3 0 003-3v-2m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Completion Rate</h3>
                <div className="flex items-center">
                  <div className="w-full mr-4">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-4 bg-green-500 rounded-full" 
                        style={{ width: `${Math.min(analytics.performanceMetrics[0]?.value || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="whitespace-nowrap text-xl font-bold text-green-600">
                    {Math.round(analytics.performanceMetrics[0]?.value || 0)}%
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Cancellation Rate</h3>
                <div className="flex items-center">
                  <div className="w-full mr-4">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-4 bg-red-500 rounded-full" 
                        style={{ width: `${Math.min(analytics.performanceMetrics[1]?.value || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="whitespace-nowrap text-xl font-bold text-red-600">
                    {Math.round(analytics.performanceMetrics[1]?.value || 0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div id="charts-container" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 chart-container">
                <h3 className="text-lg font-semibold mb-4">Appointment Status Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={true}
                    >
                      {analytics.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} appointments`, name]} />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 mt-4 gap-4">
                  {analytics.statusDistribution.map((status, index) => (
                    <div key={index} className="text-center">
                      <div className="text-sm font-medium text-gray-500">{status.name}</div>
                      <div className="text-lg font-semibold" style={{ color: COLORS[index % COLORS.length] }}>
                        {status.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patient Return Rate */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 chart-container">
                <h3 className="text-lg font-semibold mb-4">Patient Return Rate</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.returnRateData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={true}
                    >
                      {analytics.returnRateData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={RETURN_COLORS[index % RETURN_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} patients`, name]} />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 mt-4 gap-4">
                  {analytics.returnRateData.map((status, index) => (
                    <div key={index} className="text-center">
                      <div className="text-sm font-medium text-gray-500">{status.name}</div>
                      <div className="text-lg font-semibold" style={{ color: RETURN_COLORS[index % RETURN_COLORS.length] }}>
                        {status.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Appointment Trends */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 chart-container">
                <h3 className="text-lg font-semibold mb-4">Appointment Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.appointmentTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      formatter={(value, name) => [value, name === 'appointments' ? 'Total' : name === 'completed' ? 'Approved' : 'Cancelled']}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px' }}
                      formatter={(value) => value === 'appointments' ? 'Total' : value === 'completed' ? 'Approved' : 'Cancelled'}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="appointments" 
                      stroke="#82ca9d" 
                      fillOpacity={1} 
                      fill="url(#colorAppointments)"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="#4ade80" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cancelled" 
                      stroke="#f87171" 
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Time Distribution */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 chart-container">
                <h3 className="text-lg font-semibold mb-4">Appointment Time Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.timeDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      angle={-45} 
                      textAnchor="end" 
                      tick={{ fontSize: 12 }} 
                      height={70}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      formatter={(value) => [`${value} appointments`, 'Count']}
                    />
                    <Legend />
                    <Bar 
                      dataKey="appointments" 
                      name="Appointments" 
                      radius={[4, 4, 0, 0]} 
                      fill="#8884d8"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Empty State */}
            {appointments.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No appointment data available</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Once you start receiving appointments, you'll see analytics and insights here.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorAnalytics;
