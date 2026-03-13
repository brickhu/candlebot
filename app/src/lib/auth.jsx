import { createContext, createSignal, useContext, onMount } from 'solid-js'
import { api } from './api'

const AuthContext = createContext()

export const AuthProvider = (props) => {
  const [user, setUser] = createSignal(null)
  const [isLoading, setIsLoading] = createSignal(true)

  const loadUser = async () => {
    if (!api.isAuthenticated()) {
      setIsLoading(false)
      return
    }

    try {
      const response = await api.getCurrentUser()
      if (response.success && response.data) {
        setUser(response.data)
      } else {
        api.clearToken()
      }
    } catch (error) {
      console.error('Failed to load user:', error)
      api.clearToken()
    } finally {
      setIsLoading(false)
    }
  }

  onMount(() => {
    loadUser()
  })

  const login = async (email, password) => {
    setIsLoading(true)
    try {
      const response = await api.login({ email, password })
      if (response.success && response.data) {
        api.setToken(response.data.access_token)
        setUser(response.data.user)
        return true
      }
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email, username, password) => {
    setIsLoading(true)
    try {
      const response = await api.register({ email, username, password })
      if (response.success && response.data) {
        api.setToken(response.data.access_token)
        setUser(response.data.user)
        return true
      }
      return false
    } catch (error) {
      console.error('Registration failed:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await api.logout()
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      api.clearToken()
      setUser(null)
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    await loadUser()
  }

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {props.children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)