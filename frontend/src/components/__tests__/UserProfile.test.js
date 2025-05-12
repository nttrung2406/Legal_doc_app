import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfile } from '../UserProfile';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/userAPI';

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the userAPI
jest.mock('../../services/userAPI', () => ({
  userAPI: {
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
  },
}));

describe('UserProfile Component', () => {
  const mockUser = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.jpg',
  };

  const mockUpdateUser = jest.fn();

  beforeEach(() => {
    useAuth.mockReturnValue({ user: mockUser, updateUser: mockUpdateUser });
    userAPI.updateProfile.mockResolvedValue({ success: true, user: mockUser });
    userAPI.changePassword.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders user information correctly', () => {
    render(<UserProfile />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('handles profile update successfully', async () => {
    render(<UserProfile />);
    
    const nameInput = screen.getByLabelText('Name');
    const emailInput = screen.getByLabelText('Email');
    const updateButton = screen.getByText('Update Profile');

    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(userAPI.updateProfile).toHaveBeenCalledWith({
        name: 'New Name',
        email: 'new@example.com',
      });
      expect(mockUpdateUser).toHaveBeenCalledWith(mockUser);
      expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
    });
  });

  it('handles password change successfully', async () => {
    render(<UserProfile />);
    
    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const changeButton = screen.getByText('Change Password');

    fireEvent.change(currentPasswordInput, { target: { value: 'current123' } });
    fireEvent.change(newPasswordInput, { target: { value: 'new123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'new123' } });
    fireEvent.click(changeButton);

    await waitFor(() => {
      expect(userAPI.changePassword).toHaveBeenCalledWith({
        currentPassword: 'current123',
        newPassword: 'new123',
      });
      expect(screen.getByText('Password changed successfully')).toBeInTheDocument();
    });
  });

  it('shows error when passwords do not match', async () => {
    render(<UserProfile />);
    
    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const changeButton = screen.getByText('Change Password');

    fireEvent.change(currentPasswordInput, { target: { value: 'current123' } });
    fireEvent.change(newPasswordInput, { target: { value: 'new123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
    fireEvent.click(changeButton);

    await waitFor(() => {
      expect(screen.getByText('New passwords do not match')).toBeInTheDocument();
    });
  });

  it('handles profile update error', async () => {
    userAPI.updateProfile.mockRejectedValue(new Error('Update failed'));
    
    render(<UserProfile />);
    
    const updateButton = screen.getByText('Update Profile');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText('An error occurred while updating profile')).toBeInTheDocument();
    });
  });

  it('handles password change error', async () => {
    userAPI.changePassword.mockRejectedValue(new Error('Password change failed'));
    
    render(<UserProfile />);
    
    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const changeButton = screen.getByText('Change Password');

    fireEvent.change(currentPasswordInput, { target: { value: 'current123' } });
    fireEvent.change(newPasswordInput, { target: { value: 'new123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'new123' } });
    fireEvent.click(changeButton);

    await waitFor(() => {
      expect(screen.getByText('An error occurred while changing password')).toBeInTheDocument();
    });
  });
}); 