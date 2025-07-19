import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

function SingerTable({ data = [] }) {
  const [sortConfig, setSortConfig] = useState({ key: 'totalServices', direction: 'desc' })
  const [expandedSinger, setExpandedSinger] = useState(null)

  const sortedData = useMemo(() => {
    if (!data.length) return []

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [data, sortConfig])

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const toggleExpanded = (singerId) => {
    setExpandedSinger(expandedSinger === singerId ? null : singerId)
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  if (!data.length) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Singer Performance</h3>
        </div>
        <div className="card-body">
          <p className="text-gray-500 text-center py-8">No singer data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900">Singer Performance</h3>
        <p className="text-sm text-gray-600 mt-1">
          Showing {data.length} singers
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Singer
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalServices')}
              >
                Services {getSortIcon('totalServices')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalSongs')}
              >
                Total Songs {getSortIcon('totalSongs')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('avgSongsPerService')}
              >
                Avg Songs/Service {getSortIcon('avgSongsPerService')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((singer) => (
              <React.Fragment key={singer.name}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {singer.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="badge badge-primary">
                      {singer.totalServices || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="badge badge-secondary">
                      {singer.totalSongs || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {singer.totalServices > 0 ? Math.round((singer.totalSongs / singer.totalServices) * 10) / 10 : 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => toggleExpanded(singer.name)}
                      className="flex items-center text-primary-600 hover:text-primary-700"
                    >
                      {expandedSinger === singer.name ? (
                        <ChevronDown className="w-4 h-4 mr-1" />
                      ) : (
                        <ChevronRight className="w-4 h-4 mr-1" />
                      )}
                      {expandedSinger === singer.name ? 'Hide' : 'Show'} Songs
                    </button>
                  </td>
                </tr>
                {expandedSinger === singer.name && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 bg-gray-50">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Songs sung by {singer.name}:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {singer.assignments && singer.assignments.length > 0 ? (
                            singer.assignments.map((assignment, index) => (
                              <div key={index} className="flex justify-between items-center text-sm">
                                <span className="text-gray-700">{assignment.song}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(assignment.date).toLocaleDateString()}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">No song data available</span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SingerTable
