import React, { useState, useMemo } from 'react'
import { useQuery } from 'react-query'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import DatePicker from 'react-datepicker'
import { Search, Calendar, RefreshCw, Download } from 'lucide-react'
import api from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import StatsCards from '../components/StatsCards'
import SingerTable from '../components/SingerTable'
import SongFrequency from '../components/SongFrequency'
import ProgressIndicator from '../components/ProgressIndicator'
import "react-datepicker/dist/react-datepicker.css"

const DATE_PRESETS = [
  { label: 'Last 30 Days', value: 'last30' },
  { label: 'Last 90 Days', value: 'last90' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last 6 Months', value: 'last6months' },
  { label: 'This Year', value: 'thisYear' },
  { label: 'Custom', value: 'custom' }
]

function Dashboard() {
  const [datePreset, setDatePreset] = useState('last30')
  const [startDate, setStartDate] = useState(subDays(new Date(), 30))
  const [endDate, setEndDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [showProgress, setShowProgress] = useState(false)

  // Calculate date range based on preset
  const dateRange = useMemo(() => {
    const now = new Date()
    switch (datePreset) {
      case 'last30':
        return { start: subDays(now, 30), end: now }
      case 'last90':
        return { start: subDays(now, 90), end: now }
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case 'last6months':
        return { start: subDays(now, 180), end: now }
      case 'thisYear':
        return { start: new Date(now.getFullYear(), 0, 1), end: now }
      case 'custom':
        return { start: startDate, end: endDate }
      default:
        return { start: subDays(now, 30), end: now }
    }
  }, [datePreset, startDate, endDate])

  // Fetch dashboard data
  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery(
    ['dashboard', dateRange.start, dateRange.end, searchTerm],
    async () => {
      setShowProgress(true) // Show progress when starting
      
      const params = new URLSearchParams({
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
      })
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await api.get(`/api/dashboard/data?${params}`)
      console.log('Dashboard API response:', response.data) // Debug log
      return response.data.data // Extract the actual data from the wrapper
    },
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      onSuccess: () => setShowProgress(false),
      onError: () => setShowProgress(false)
    }
  )

  const handleDatePresetChange = (preset) => {
    setDatePreset(preset)
    if (preset !== 'custom') {
      // Reset custom dates when switching away from custom
      const now = new Date()
      setStartDate(subDays(now, 30))
      setEndDate(now)
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
        format: 'csv'
      })
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await api.get(`/api/dashboard/export?${params}`, {
        responseType: 'blob'
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `worship-dashboard-${format(new Date(), 'yyyy-MM-dd')}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          Error loading dashboard data: {error.message}
        </div>
        <button
          onClick={() => refetch()}
          className="btn-primary"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Worship planning insights from {format(dateRange.start, 'MMM d, yyyy')} to {format(dateRange.end, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex space-x-3">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={isLoading || !dashboardData}
            className="btn-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Date Preset */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={datePreset}
                onChange={(e) => handleDatePresetChange(e.target.value)}
                className="form-input"
              >
                {DATE_PRESETS.map(preset => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Date Range */}
            {datePreset === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    className="form-input"
                    dateFormat="yyyy-MM-dd"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    className="form-input"
                    dateFormat="yyyy-MM-dd"
                  />
                </div>
              </>
            )}

            {/* Search */}
            <div className={datePreset === 'custom' ? 'lg:col-span-1' : 'lg:col-span-2'}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Singers
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by singer name..."
                  className="form-input pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Loading dashboard data...</p>
        </div>
      ) : dashboardData ? (
        <>
          {/* Stats Cards */}
          <StatsCards data={dashboardData.summary} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Singer Data Table */}
            <div className="xl:col-span-2">
              <SingerTable data={dashboardData.singers} />
            </div>

            {/* Song Frequency */}
            <div className="xl:col-span-1">
              <SongFrequency data={dashboardData.songs} />
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No data available for the selected date range.</p>
        </div>
      )}
      
      {/* Progress Indicator */}
      <ProgressIndicator 
        isVisible={showProgress || isLoading} 
        onComplete={() => setShowProgress(false)}
      />
    </div>
  )
}

export default Dashboard
