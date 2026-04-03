import api from './api';

/**
 * Flashcard Service
 * Interacts with the /flashcards and /lessons/{id}/flashcards endpoints
 * defined in the AI Tutor Platform API.
 */
const flashcardService = {
  /**
   * Get all flashcards for the current user.
   * @param {Object} params - Query parameters (lesson_id, difficulty, skip, limit)
   * @returns {Promise} - Resolves to an array of FlashcardResponse
   */
  getFlashcards: async (params = {}) => {
    const response = await api.get('/flashcards', { params });
    return response.data;
  },

  /**
   * Get a specific flashcard by ID.
   * @param {number} flashcardId - The ID of the flashcard
   * @returns {Promise} - Resolves to FlashcardResponse
   */
  getFlashcard: async (flashcardId) => {
    const response = await api.get(`/flashcards/${flashcardId}`);
    return response.data;
  },

  /**
   * Get all flashcards for a specific lesson.
   * @param {number} lessonId - The ID of the lesson
   * @returns {Promise} - Resolves to an array of FlashcardResponse
   */
  getLessonFlashcards: async (lessonId) => {
    const response = await api.get(`/lessons/${lessonId}/flashcards`);
    return response.data;
  },

  /**
   * Update a flashcard.
   * @param {number} flashcardId - The ID of the flashcard
   * @param {Object} data - FlashcardUpdate body (front, back, difficulty)
   * @returns {Promise} - Resolves to FlashcardResponse
   */
  updateFlashcard: async (flashcardId, data) => {
    const response = await api.put(`/flashcards/${flashcardId}`, data);
    return response.data;
  },

  /**
   * Delete a flashcard.
   * @param {number} flashcardId - The ID of the flashcard
   * @returns {Promise}
   */
  deleteFlashcard: async (flashcardId) => {
    const response = await api.delete(`/flashcards/${flashcardId}`);
    return response.data;
  },
};

export default flashcardService;
