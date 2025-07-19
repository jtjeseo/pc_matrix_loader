import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import api from '../services/api'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const { data: userData, isLoading } = useQuery(
    'user',
    async () => {
      try {
        const response = await api.get('/auth/user')
        return response.data
      } catch (error) {
        if (error.response?.status === 401) {
          return null
        }
        throw error
      }
    },
    {
      retry: false,
      onSuccess: (data) => {
        setUser(data)
        setLoading(false)
      },
      onError: () => {
        setUser(null)
        setLoading(false)
      }
    }
  )

  useEffect(() => {
    if (!isLoading) {
      setUser(userData)
      setLoading(false)
    }
  }, [userData, isLoading])

  const login = () => {
    window.location.href = '/auth/login'
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
      setUser(null)
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout on client side
      setUser(null)
      window.location.href = '/login'
    }
  }

  return {
    user,
    loading,
    login,
    logout
  }
}
