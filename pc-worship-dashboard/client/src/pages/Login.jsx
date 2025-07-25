import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { LogIn } from 'lucide-react'

function Login() {
  const { login } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Planning Center Worship Dashboard
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in with your Planning Center account to continue
          </p>
        </div>
        <div>
          <button
            onClick={login}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <LogIn className="h-5 w-5 text-primary-500 group-hover:text-primary-400" />
            </span>
            Sign in with Planning Center
          </button>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500">
            This application requires a Planning Center Services account with appropriate permissions.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
