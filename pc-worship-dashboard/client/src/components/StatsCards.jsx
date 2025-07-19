import React from 'react'
import { Users, Calendar, Music, TrendingUp } from 'lucide-react'

function StatsCards({ data = {} }) {
  const stats = [
    {
      name: 'Total Services',
      value: data.totalServices || 0,
      icon: Calendar,
      color: 'bg-blue-500'
    },
    {
      name: 'Active Singers',
      value: data.activeSingers || 0,
      icon: Users,
      color: 'bg-green-500'
    },
    {
      name: 'Unique Songs',
      value: data.uniqueSongs || 0,
      icon: Music,
      color: 'bg-purple-500'
    },
    {
      name: 'Avg Singers/Service',
      value: data.avgSingersPerService ? Math.round(data.avgSingersPerService * 10) / 10 : 0,
      icon: TrendingUp,
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.name} className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {stat.name}
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </dd>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatsCards
