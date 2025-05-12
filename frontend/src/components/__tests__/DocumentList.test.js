import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentList } from '../DocumentList';
import { documentAPI } from '../../services/documentAPI';
import { useAuth } from '../../contexts/AuthContext';

// Mock the documentAPI
jest.mock('../../services/documentAPI', () => ({
  documentAPI: {
    getUserDocuments: jest.fn(),
    deleteDocument: jest.fn(),
  },
}));

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('DocumentList Component', () => {
  const mockUser = { id: '123', name: 'Test User' };
  const mockDocuments = [
    {
      id: '1',
      title: 'Test Document 1',
      upload_date: '2024-03-20T10:00:00Z',
      status: 'processed',
    },
    {
      id: '2',
      title: 'Test Document 2',
      upload_date: '2024-03-20T11:00:00Z',
      status: 'processing',
    },
  ];

  beforeEach(() => {
    useAuth.mockReturnValue({ user: mockUser });
    documentAPI.getUserDocuments.mockResolvedValue(mockDocuments);
    documentAPI.deleteDocument.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<DocumentList />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders documents after loading', async () => {
    render(<DocumentList />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Document 1')).toBeInTheDocument();
      expect(screen.getByText('Test Document 2')).toBeInTheDocument();
    });
  });

  it('handles document deletion', async () => {
    render(<DocumentList />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Document 1')).toBeInTheDocument();
    });

    const deleteButton = screen.getAllByText('Delete')[0];
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(documentAPI.deleteDocument).toHaveBeenCalledWith('1');
    });
  });

  it('handles error when fetching documents', async () => {
    documentAPI.getUserDocuments.mockRejectedValue(new Error('Failed to fetch'));
    
    render(<DocumentList />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading documents')).toBeInTheDocument();
    });
  });

  it('displays document status correctly', async () => {
    render(<DocumentList />);
    
    await waitFor(() => {
      expect(screen.getByText('Processed')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
    });
  });

  it('formats upload date correctly', async () => {
    render(<DocumentList />);
    
    await waitFor(() => {
      expect(screen.getByText('March 20, 2024')).toBeInTheDocument();
    });
  });
}); 