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
   * @param {Object} data - Request body (session_id, prompt)
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
};

export default chatService;
