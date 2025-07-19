import React from 'react'

function SongFrequency({ data = [] }) {
  if (!data.length) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Song Frequency</h3>
        </div>
        <div className="card-body">
          <p className="text-gray-500 text-center py-8">No song data available</p>
        </div>
      </div>
    )
  }

  // Sort by count descending and take top 10
  const topSongs = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const maxCount = Math.max(...topSongs.map(song => song.count))

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900">Top Songs</h3>
        <p className="text-sm text-gray-600 mt-1">
          Most frequently sung songs
        </p>
      </div>
      <div className="card-body">
        <div className="space-y-4">
          {topSongs.map((song, index) => {
            const percentage = (song.count / maxCount) * 100
            
            return (
              <div key={`${song.title}-${index}`} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {song.title}
                    </p>
                    {song.artist && (
                      <p className="text-xs text-gray-500 truncate">
                        by {song.artist}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="badge badge-primary">
                      {song.count}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
          
          {data.length > 10 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Showing top 10 of {data.length} songs
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SongFrequency
