import api from './api';

const courseService = {
  /**
   * Get all courses for the current user.
   */
  getCourses: async (params = {}) => {
    const response = await api.get('/courses', { params });
    return response.data;
  },

  /**
   * Get all lessons for a specific course.
   */
  getCourseLessons: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/lessons`);
    return response.data;
  },
};

export default courseService;
