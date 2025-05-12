import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Auth API
export const authAPI = {
    login: async (username, password) => {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
        return response.data;
    },
    
    signup: async (userData) => {
        const response = await axios.post(`${API_BASE_URL}/auth/signup`, userData);
        return response.data;
    },
    
    logout: async (token) => {
        const response = await axios.post(`${API_BASE_URL}/auth/logout`, { token });
        return response.data;
    }
};

// Document API
export const documentAPI = {
    upload: async (file, userId) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', userId);
        
        const response = await axios.post(`${API_BASE_URL}/document/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },
    
    getUserDocuments: async (userId) => {
        const response = await axios.get(`${API_BASE_URL}/document/documents/${userId}`);
        return response.data;
    }
};

// RAG API
export const ragAPI = {
    summarize: async (documentId) => {
        const response = await axios.post(`${API_BASE_URL}/rag/summarize/${documentId}`);
        return response.data;
    },
    
    askQuestion: async (question, documentId) => {
        const response = await axios.post(`${API_BASE_URL}/rag/ask`, {
            text: question,
            document_id: documentId
        });
        return response.data;
    },
    
    getSections: async (documentId) => {
        const response = await axios.get(`${API_BASE_URL}/rag/sections/${documentId}`);
        return response.data;
    }
}; 