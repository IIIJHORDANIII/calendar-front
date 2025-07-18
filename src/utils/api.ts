import React from 'react';
import { useNavigate } from 'react-router-dom';

// Centralized API utility for handling requests and 401 errors
class ApiService {
  private baseURL = 'http://localhost:3005';
  private navigate: ((path: string) => void) | null = null;

  // Set navigation function (to be called from components)
  setNavigate(navigate: (path: string) => void) {
    this.navigate = navigate;
  }

  // Handle 401 errors and redirect to login
  private handleUnauthorized() {
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login if navigate function is available
    if (this.navigate) {
      this.navigate('/login');
    } else {
      // Fallback: redirect using window.location
      window.location.href = '/login';
    }
  }

  // Generic request method
  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('token');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      // Handle 401 errors
      if (response.status === 401) {
        this.handleUnauthorized();
        throw new Error('Unauthorized - redirecting to login');
      }
      
      return response;
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Network error:', error);
        throw new Error('Erro de conexão. Verifique se o servidor está rodando.');
      }
      throw error;
    }
  }

  // GET request
  async get(endpoint: string): Promise<Response> {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint: string, data?: any): Promise<Response> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put(endpoint: string, data?: any): Promise<Response> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete(endpoint: string): Promise<Response> {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // PATCH request
  async patch(endpoint: string, data?: any): Promise<Response> {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Create singleton instance
const apiService = new ApiService();

// Hook to use API service with navigation
export const useApi = () => {
  const navigate = useNavigate();
  
  // Set navigation function when hook is used
  React.useEffect(() => {
    apiService.setNavigate(navigate);
  }, [navigate]);
  
  return apiService;
};

// Export the service for direct use
export default apiService; 