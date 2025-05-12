import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    CircularProgress,
    List,
    ListItem,
    Divider,
    IconButton,
    Alert
} from '@mui/material';
import { Send, Refresh } from '@mui/icons-material';
import { ragAPI } from '../services/api';

const QAInterface = ({ documentId }) => {
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        setLoading(true);
        setError('');

        try {
            const response = await ragAPI.askQuestion(question, documentId);
            setChatHistory(prev => [
                ...prev,
                { type: 'question', content: question },
                { type: 'answer', content: response.answer }
            ]);
            setQuestion('');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to get answer. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setChatHistory([]);
        setError('');
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Ask Questions About Your Document</Typography>
                    <IconButton onClick={handleClear} color="primary" title="Clear chat">
                        <Refresh />
                    </IconButton>
                </Box>

                <Box sx={{ height: 400, overflowY: 'auto', mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <List>
                        {chatHistory.map((item, index) => (
                            <React.Fragment key={index}>
                                <ListItem
                                    sx={{
                                        justifyContent: item.type === 'question' ? 'flex-end' : 'flex-start',
                                        mb: 1
                                    }}
                                >
                                    <Paper
                                        elevation={1}
                                        sx={{
                                            p: 2,
                                            maxWidth: '70%',
                                            bgcolor: item.type === 'question' ? 'primary.light' : 'white',
                                            color: item.type === 'question' ? 'white' : 'text.primary'
                                        }}
                                    >
                                        <Typography variant="body1">{item.content}</Typography>
                                    </Paper>
                                </ListItem>
                                {index < chatHistory.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                        <div ref={chatEndRef} />
                    </List>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Type your question here..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            disabled={loading}
                            size="small"
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={!question.trim() || loading}
                            sx={{ minWidth: 100 }}
                        >
                            {loading ? <CircularProgress size={24} /> : <Send />}
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Box>
    );
};

export default QAInterface; 