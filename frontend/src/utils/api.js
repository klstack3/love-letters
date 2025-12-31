const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Upload image file
   */
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${this.baseURL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Generate professional headshot
   */
  async generateHeadshot(sessionId, style) {
    try {
      const response = await fetch(`${this.baseURL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          style
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Generation error:', error);
      throw new Error(`Generation failed: ${error.message}`);
    }
  }

  /**
   * Get generated image URL
   */
  getImageUrl(imageId) {
    return `${this.baseURL}/image/${imageId}`;
  }

  /**
   * Get download URL
   */
  getDownloadUrl(imageId) {
    return `${this.baseURL}/download/${imageId}`;
  }

  /**
   * Get available styles
   */
  async getStyles() {
    try {
      const response = await fetch(`${this.baseURL}/styles`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch styles');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Styles error:', error);
      throw new Error(`Failed to fetch styles: ${error.message}`);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export default new ApiClient();