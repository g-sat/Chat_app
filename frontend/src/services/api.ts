import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use 10.0.2.2 for Android emulator to access localhost
const API_URL = 'http://10.0.2.2:8000';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for CORS requests
});

// Add request interceptor to add token to requests
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('token');
    console.log('Using token in axios interceptor:', token); // Debug log
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  },
);

export const authService = {
  async signUp(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) {
    try {
      console.log('Signing up with data:', userData);
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    } catch (error: any) {
      console.error('Signup error:', error.response?.data || error.message);
      throw error;
    }
  },

  async signIn(email: string, password: string) {
    try {
      console.log('Attempting sign in for email:', email);
      // Backend expects a JSON body with email and password
      const response = await api.post('/api/auth/login', { email, password });
      console.log('Sign in response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Sign in error:', error.response?.data || error.message);
      throw error;
    }
  },

  async signOut() {
    try {
      await AsyncStorage.removeItem('token');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },
};

export const ticketService = {
  // Create a new ticket
  async createTicket(data: { title: string; description: string; priority: string; assignee_id: number | null }) {
    const response = await api.post('/api/tickets/', data);
    return response.data;
  },

  // Get all tickets for the current user (or all if admin)
  async getTickets() {
    const response = await api.get('/api/tickets/');
    return response.data;
  },

  // Get a specific ticket by ID
  async getTicket(ticketId: number) {
    const response = await api.get(`/api/tickets/${ticketId}`);
    return response.data;
  },

  // Update ticket status (admin only)
  async updateTicketStatus(ticketId: number, status: string) {
    // Assuming status update is part of ticket update
    const response = await api.put(`/api/tickets/${ticketId}`, { status });
    return response.data;
  },
};

export const messageService = {
  // Fetch all messages for a ticket
  async getMessages(ticketId: number) {
    const response = await api.get(`/api/messages/ticket/${ticketId}`);
    return response.data;
  },

  // Optionally, create a message via REST (not needed if using WebSocket)
  async createMessage(ticketId: number, content: string, receiver_id: number) {
    const response = await api.post('/api/messages/', { ticket_id: ticketId, content, receiver_id });
    return response.data;
  },
};

export const userService = {
  async getUser(userId: number) {
    const response = await api.get(`/api/users/${userId}`);
    return response.data;
  },
};

export default api;
