import api from './api';

/**
 * Chat Service
 * Interacts with the /chats endpoints defined in the AI Tutor Platform API.
 */
const chatService = {
  /**
   * Get all chats for the current user.
   * @param {Object} params - Query parameters (session_id, skip, limit)
   * @returns {Promise} - Resolves to an array of ChatListResponse
   */
  getChats: async (params = {}) => {
    const response = await api.get('/chats', { params });
    return response.data;
  },

  /**
   * Create a new chat and generate an AI response.
   * @param {Object|FormData} data - Request body (session_id, prompt) or FormData containing audio
   * @returns {Promise} - Resolves to ChatResponse
   */
  createChat: async (data) => {
    const response = await api.post('/chats', data);
    return response.data;
  },

  /**
   * Get a specific chat by ID.
   * @param {number} chatId - The ID of the chat
   * @returns {Promise} - Resolves to ChatResponse
   */
  getChat: async (chatId) => {
    const response = await api.get(`/chats/${chatId}`);
    return response.data;
  },

  /**
   * Delete a specific chat session by ID.
   * @param {string} sessionId - The session ID to delete
   * @returns {Promise} - Resolves to 204 No Content
   */
  deleteSession: async (sessionId) => {
    const response = await api.delete(`/chats/sessions/${sessionId}`);
    return response.data;
  },
};

export default chatService;
