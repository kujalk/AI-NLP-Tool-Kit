import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Box, CssBaseline, Drawer, List, ListItem, ListItemIcon, ListItemText,
  Toolbar, Typography, TextField, Button, Card, CardContent, Divider,
  CircularProgress, Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SummarizeIcon from '@mui/icons-material/Summarize';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';

// Styled Components for Innovation
const GradientDrawer = styled(Drawer)({
  '& .MuiDrawer-paper': {
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    color: '#fff',
    width: 240,
    borderRight: 'none',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
});

const GlassCard = styled(Card)({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  color: '#fff',
});

const AppContainer = styled(Box)({
  display: 'flex',
  minHeight: '100vh',
  background: 'linear-gradient(to bottom right, #0f2027, #203a43, #2c5364)',
});

const MainContent = styled(Box)({
  flexGrow: 1,
  padding: '40px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const App = () => {
  const [selectedTask, setSelectedTask] = useState('summarization');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const HF_TOKEN = process.env.REACT_APP_HUGGING_FACE_TOKEN || '';
  
  const tasks = [
    { 
      name: 'Summarization', 
      icon: <SummarizeIcon />, 
      endpoint: 'facebook/bart-large-cnn', 
      task: 'summarization',
      apiConfig: {
        method: 'post',
        data: { inputs: '', parameters: { max_length: 100, min_length: 30 } }
      }
    },
    { 
      name: 'Named Entity Recognition', 
      icon: <AssignmentIndIcon />, 
      endpoint: 'dslim/bert-base-NER', 
      task: 'ner',
      apiConfig: {
        method: 'post',
        data: { inputs: '' }
      }
    },
    { 
      name: 'Sentiment Analysis', 
      icon: <SentimentSatisfiedAltIcon />, 
      endpoint: 'distilbert/distilbert-base-uncased-finetuned-sst-2-english', 
      task: 'sentiment',
      apiConfig: {
        method: 'post',
        data: { inputs: '' }
      }
    },
  ];

  const handleTaskSelect = (task) => {
    setSelectedTask(task);
    setOutputText('');
    setInputText('');
    setError('');
  };

  // Create a proxy server setup for the README
  const proxyEndpoint = 'https://your-backend-proxy-url.com/huggingface-proxy';
  // In a real app, you would set up a backend proxy server to handle CORS

  const handleSubmit = async () => {
    setLoading(true);
    setOutputText('');
    setError('');

    try {
      const taskConfig = tasks.find(t => t.task === selectedTask);
      
      // Update the input text in the API configuration
      const apiConfig = { ...taskConfig.apiConfig };
      
      if (taskConfig.task === 'summarization') {
        apiConfig.data.inputs = inputText;
      } else {
        apiConfig.data.inputs = inputText;
      }

      // Instead of direct API call, we'll simulate processing with proper response formatting
      // In a real app, you would use your backend proxy
      let result;
      
      switch (taskConfig.task) {
        case 'summarization':
          // Simulating proper API response for summarization
          const response = await axios.post(
            `https://api-inference.huggingface.co/models/${taskConfig.endpoint}`,
            { inputs: inputText, parameters: { max_length: 100, min_length: 30 } },
            { headers: { Authorization: `Bearer ${HF_TOKEN}` } }
          );
          
          if (Array.isArray(response.data) && response.data.length > 0) {
            result = response.data[0].summary_text;
          } else {
            throw new Error('Invalid response format for summarization');
          }
          break;
          
        case 'ner':
          // For NER, we need to handle the entity recognition format including empty responses
          try {
            const response = await axios.post(
              `https://api-inference.huggingface.co/models/${taskConfig.endpoint}`,
              { inputs: inputText },
              { headers: { Authorization: `Bearer ${HF_TOKEN}` } }
            );
            
            console.log('NER response:', response.data);
            
            // Check if the response data is empty or doesn't contain any entities
            if (!response.data || 
                (Array.isArray(response.data) && response.data.length === 0) || 
                (typeof response.data === 'object' && Object.keys(response.data).length === 0)) {
              result = "No named entities found in the text.";
            } else {
              let entities = [];
              
              // Handle different response formats
              if (Array.isArray(response.data)) {
                if (Array.isArray(response.data[0])) {
                  // Handle array of arrays format
                  entities = response.data.flat().filter(item => item.entity !== 'O');
                } else if (response.data[0] && typeof response.data[0] === 'object') {
                  // Handle array of objects format
                  entities = response.data;
                }
              } else if (typeof response.data === 'object') {
                // Handle object format with entity properties
                const entityValues = Object.values(response.data);
                if (Array.isArray(entityValues) && entityValues.length > 0) {
                  entities = entityValues.flat();
                }
              }
              
              // Check if we found any entities after parsing
              if (entities.length === 0) {
                result = "No named entities found in the text.";
              } else {
                // Format the entities we found
                result = entities.map(entity => {
                  const word = entity.word || entity.token || entity.text || '';
                  const entityType = entity.entity_group || entity.entity || entity.type || '';
                  return `${word}: ${entityType}`;
                }).join('\n');
              }
            }
          } catch (error) {
            console.error("NER Error:", error);
            throw new Error('Failed to process NER request');
          }
          break;
          
        case 'sentiment':
          // For sentiment analysis
          try {
            const response = await axios.post(
              `https://api-inference.huggingface.co/models/${taskConfig.endpoint}`,
              { inputs: inputText },
              { headers: { Authorization: `Bearer ${HF_TOKEN}` } }
            );
            
            if (Array.isArray(response.data) && response.data.length > 0) {
              // The response contains an array of possible labels with confidence scores
              // We need to find the one with the highest score
              console.log('Sentiment response:', response.data);
              
              // First, find the sentiment with the highest score
              const sentiments = response.data[0];
              if (!Array.isArray(sentiments)) {
                // If there's only one result object
                const highestSentiment = sentiments;
                result = `${highestSentiment.label} (Confidence: ${(highestSentiment.score * 100).toFixed(2)}%)`;
                
                if (highestSentiment.label.includes('POSITIVE')) {
                  result += "\n\nThe text expresses a positive sentiment.";
                } else if (highestSentiment.label.includes('NEGATIVE')) {
                  result += "\n\nThe text expresses a negative sentiment.";
                } else {
                  result += "\n\nThe text expresses a neutral sentiment.";
                }
              } else {
                // If the response contains an array of sentiment options
                const highestSentiment = sentiments.reduce((prev, current) => 
                  (prev.score > current.score) ? prev : current
                );
                
                result = `${highestSentiment.label} (Confidence: ${(highestSentiment.score * 100).toFixed(2)}%)`;
                
                // If we have other sentiments, show them as well
                const otherSentiments = sentiments.filter(s => s.label !== highestSentiment.label)
                  .sort((a, b) => b.score - a.score);
                
                if (otherSentiments.length > 0) {
                  result += "\n\nOther possibilities:";
                  otherSentiments.forEach(sentiment => {
                    result += `\n${sentiment.label}: ${(sentiment.score * 100).toFixed(2)}%`;
                  });
                }
                
                // Add context based on the highest sentiment
                if (highestSentiment.label.includes('POSITIVE')) {
                  result += "\n\nThe text expresses a positive sentiment.";
                } else if (highestSentiment.label.includes('NEGATIVE')) {
                  result += "\n\nThe text expresses a negative sentiment.";
                } else {
                  result += "\n\nThe text expresses a neutral sentiment.";
                }
              }
            } else {
              throw new Error('Invalid response format for sentiment analysis');
            }
          } catch (error) {
            console.error("Sentiment Error:", error);
            throw new Error('Failed to process sentiment analysis request');
          }
          break;
          
        default:
          result = 'Task not supported';
      }
      
      setOutputText(result);
    } catch (error) {
      console.error('API Error:', error);
      setError(
        error.response?.status === 503
          ? 'Service Unavailable, May be Model is loading. Please try again later.'
          : error.response?.status === 403 
            ? 'Authentication failed. Please check your API token.'
            : error.response?.status === 429
              ? 'Too many requests. Please try again later.'
              : 'Error: Could not process the request. This may be due to CORS restrictions. In a production app, you would need a backend proxy to handle these requests.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContainer>
      <CssBaseline />
      <GradientDrawer variant="permanent">
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
            AI Toolkit
          </Typography>
        </Toolbar>
        <Divider sx={{ background: 'rgba(255, 255, 255, 0.2)' }} />
        <List>
          {tasks.map((task) => (
            <ListItem
              button
              key={task.name}
              onClick={() => handleTaskSelect(task.task)}
              sx={{
                borderRadius: '0 24px 24px 0',
                background: selectedTask === task.task ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                '&:hover': { background: 'rgba(255, 255, 255, 0.1)' },
                transition: 'all 0.3s ease',
              }}
            >
              <ListItemIcon sx={{ color: '#fff' }}>{task.icon}</ListItemIcon>
              <ListItemText primary={task.name} />
            </ListItem>
          ))}
        </List>
      </GradientDrawer>

      <MainContent>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 600 }}
        >
          <GlassCard sx={{ padding: 4 }}>
            <CardContent>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center', color: '#fff' }}>
                {tasks.find(t => t.task === selectedTask)?.name || 'AI Tool'}
              </Typography>
              <TextField
                label="Enter your text here"
                multiline
                rows={4}
                fullWidth
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                variant="outlined"
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#fff',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                    '&:hover fieldset': { borderColor: '#fff' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading || !inputText}
                  sx={{
                    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                    borderRadius: '20px',
                    padding: '10px 30px',
                    fontWeight: 'bold',
                    '&:hover': { background: 'linear-gradient(45deg, #FF8E53 30%, #FE6B8B 90%)' },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                  ) : null}
                  {loading ? 'Processing...' : 'Submit'}
                </Button>
              </Box>
              
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Alert severity="error" sx={{ mt: 3, background: 'rgba(211, 47, 47, 0.2)', color: '#fff' }}>
                    {error}
                  </Alert>
                </motion.div>
              )}
              
              {outputText && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Typography variant="h6" sx={{ mt: 3, color: '#fff' }}>
                    Output:
                  </Typography>
                  <Box 
                    sx={{ 
                      mt: 1, 
                      p: 2, 
                      borderRadius: 2, 
                      background: 'rgba(255, 255, 255, 0.05)',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    <Typography variant="body1" sx={{ color: '#ddd' }}>
                      {outputText}
                    </Typography>
                  </Box>
                </motion.div>
              )}
            </CardContent>
          </GlassCard>
        </motion.div>
      </MainContent>
    </AppContainer>
  );
};

export default App;