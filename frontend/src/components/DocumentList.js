import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Chip,
    CircularProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button
} from '@mui/material';
import {
    Description,
    Delete,
    Summarize,
    QuestionAnswer,
    Visibility
} from '@mui/icons-material';
import { documentAPI } from '../services/api';

const DocumentList = ({ userId, onDocumentSelect }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [summary, setSummary] = useState('');
    const [showSummary, setShowSummary] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, [userId]);

    const fetchDocuments = async () => {
        try {
            const response = await documentAPI.getUserDocuments(userId);
            setDocuments(response);
        } catch (err) {
            setError('Failed to fetch documents');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (docId) => {
        try {
            await documentAPI.deleteDocument(docId);
            setDocuments(documents.filter(doc => doc.id !== docId));
        } catch (err) {
            setError('Failed to delete document');
        }
    };

    const handleViewSummary = async (docId) => {
        try {
            const response = await documentAPI.getSummary(docId);
            setSummary(response.summary);
            setSelectedDoc(docId);
            setShowSummary(true);
        } catch (err) {
            setError('Failed to fetch summary');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Your Documents
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <List>
                    {documents.map((doc) => (
                        <ListItem
                            key={doc.id}
                            sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                mb: 1,
                                '&:hover': {
                                    bgcolor: 'action.hover'
                                }
                            }}
                        >
                            <ListItemText
                                primary={doc.original_filename}
                                secondary={`Uploaded: ${new Date(doc.upload_date).toLocaleDateString()}`}
                            />
                            <ListItemSecondaryAction>
                                <IconButton
                                    edge="end"
                                    onClick={() => onDocumentSelect(doc.id)}
                                    title="Ask Questions"
                                >
                                    <QuestionAnswer />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    onClick={() => handleViewSummary(doc.id)}
                                    title="View Summary"
                                >
                                    <Summarize />
                                </IconButton>
                                <IconButton
                                    edge="end"
                                    onClick={() => handleDelete(doc.id)}
                                    title="Delete"
                                >
                                    <Delete />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>

                {documents.length === 0 && (
                    <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 2 }}>
                        No documents uploaded yet
                    </Typography>
                )}
            </Paper>

            <Dialog open={showSummary} onClose={() => setShowSummary(false)} maxWidth="md" fullWidth>
                <DialogTitle>Document Summary</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {summary}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSummary(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DocumentList; 