import React, { useState, useCallback } from 'react';
import { 
    Box, 
    Paper, 
    Typography, 
    Button, 
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    ListItemIcon
} from '@mui/material';
import { CloudUpload, Description, CheckCircle, Error } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { documentAPI } from '../services/api';

const DocumentUpload = ({ userId, onUploadSuccess }) => {
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const onDrop = useCallback(acceptedFiles => {
        setFiles(acceptedFiles);
        setError('');
        setSuccess('');
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg']
        },
        multiple: false
    });

    const handleUpload = async () => {
        if (files.length === 0) return;

        setUploading(true);
        setError('');
        setSuccess('');

        try {
            const response = await documentAPI.upload(files[0], userId);
            setSuccess('Document uploaded successfully!');
            onUploadSuccess(response);
            setFiles([]);
        } catch (err) {
            setError(err.response?.data?.detail || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <Paper 
                elevation={3} 
                sx={{ 
                    p: 4, 
                    borderRadius: 2,
                    backgroundColor: isDragActive ? 'action.hover' : 'background.paper'
                }}
            >
                <Box
                    {...getRootProps()}
                    sx={{
                        border: '2px dashed',
                        borderColor: isDragActive ? 'primary.main' : 'grey.300',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        mb: 2
                    }}
                >
                    <input {...getInputProps()} />
                    <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        {isDragActive ? 'Drop the file here' : 'Drag & drop a document here'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        or click to select a file
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        Supported formats: PDF, PNG, JPG
                    </Typography>
                </Box>

                {files.length > 0 && (
                    <List>
                        {files.map((file, index) => (
                            <ListItem key={index}>
                                <ListItemIcon>
                                    <Description color="primary" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={file.name}
                                    secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        <Error sx={{ mr: 1 }} />
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        <CheckCircle sx={{ mr: 1 }} />
                        {success}
                    </Alert>
                )}

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleUpload}
                    disabled={files.length === 0 || uploading}
                    sx={{ mt: 2 }}
                >
                    {uploading ? <CircularProgress size={24} /> : 'Upload Document'}
                </Button>
            </Paper>
        </Box>
    );
};

export default DocumentUpload; 