import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Avatar,
  Divider,
  ListItemAvatar,
  ListItemButton,
  Badge,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MenuIcon from '@mui/icons-material/Menu';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ChatIcon from '@mui/icons-material/Chat';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import Logo from '../assets/logo.png'; 

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface Chat {
  id: number;
  title: string;
  messages: Message[];
  lastUpdated: Date;
}

interface ListItem {
  name?: string;
  description?: string;
  [key: string]: any;
}

interface StructuredContent {
  items?: ListItem[];
  message?: string;
  [key: string]: any;
}

interface ChatInterfaceProps {
  onNewUpload: () => void;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error in component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'error.main',
            fontStyle: 'italic'
          }}
        >
          Error rendering content. Please try again.
        </Typography>
      );
    }

    return this.props.children;
  }
}

const ChatInterface = ({ onNewUpload }: ChatInterfaceProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([
    { 
      id: 1, 
      title: 'Document Analysis', 
      messages: [],
      lastUpdated: new Date()
    }
  ]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      const userMessage: Message = {
        id: Date.now(),
        text: message,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      setIsLoading(true);

      try {
        const response = await fetch('http://localhost:8000/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: message }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const result = await response.json();
        
        const botMessage: Message = {
          id: Date.now() + 1,
          text: result.status === 'success' ? JSON.stringify(result.answer) : result.message, // Stringify the answer
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, botMessage]);
      } catch (error) {
        console.error('Error:', error);
        const errorMessage: Message = {
          id: Date.now() + 1,
          text: 'Sorry, I encountered an error while processing your request. Please try again.',
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessageContent = (text: string) => {
    if (!text) return null;

    try {
      // Try to parse the text as JSON
      const parsedContent = JSON.parse(text);
      
      // If it's an array, render as a list
      if (Array.isArray(parsedContent)) {
        return (
          <ErrorBoundary>
            <Box sx={{ mt: 1 }}>
              {parsedContent.length > 0 ? (
                <List sx={{ listStyleType: 'disc', pl: 2 }}>
                  {parsedContent.map((item: ListItem, index: number) => (
                    <ListItem 
                      key={index} 
                      sx={{ 
                        display: 'list-item',
                        py: 1,
                        '&::marker': {
                          color: 'primary.main'
                        }
                      }}
                    >
                      <Box>
                        {item.name && (
                          <Typography 
                            variant="subtitle1" 
                            component="span" // Changed to span to avoid nested <p>
                            sx={{ 
                              fontWeight: 'bold',
                              color: 'primary.main',
                              mb: 0.5
                            }}
                          >
                            {item.name}
                          </Typography>
                        )}
                        {item.description && (
                          <Typography 
                            variant="body2" 
                            component="span" // Changed to span to avoid nested <p>
                            sx={{ 
                              color: 'text.secondary',
                              lineHeight: 1.6
                            }}
                          >
                            {item.description}
                          </Typography>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    fontStyle: 'italic'
                  }}
                >
                  No items found.
                </Typography>
              )}
            </Box>
          </ErrorBoundary>
        );
      }
      
      // If it's an object with a specific structure, render accordingly
      if (parsedContent.items && Array.isArray(parsedContent.items)) {
        return (
          <ErrorBoundary>
            <Box sx={{ mt: 1 }}>
              {parsedContent.items.length > 0 ? (
                <List sx={{ listStyleType: 'disc', pl: 2 }}>
                  {parsedContent.items.map((item: ListItem, index: number) => (
                    <ListItem 
                      key={index} 
                      sx={{ 
                        display: 'list-item',
                        py: 1,
                        '&::marker': {
                          color: 'primary.main'
                        }
                      }}
                    >
                      <Box>
                        {item.name && (
                          <Typography 
                            variant="subtitle1" 
                            component="span" // Changed to span to avoid nested <p>
                            sx={{ 
                              fontWeight: 'bold',
                              color: 'primary.main',
                              mb: 0.5
                            }}
                          >
                            {item.name}
                          </Typography>
                        )}
                        {item.description && (
                          <Typography 
                            variant="body2" 
                            component="span" // Changed to span to avoid nested <p>
                            sx={{ 
                              color: 'text.secondary',
                              lineHeight: 1.6
                            }}
                          >
                            {item.description}
                          </Typography>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    fontStyle: 'italic'
                  }}
                >
                  No items found.
                </Typography>
              )}
            </Box>
          </ErrorBoundary>
        );
      }
      
      // If it's a simple object with a message
      if (parsedContent.message) {
        return (
          <ErrorBoundary>
            <Typography 
              variant="body2" 
              component="span" // Changed to span to avoid nested <p>
              sx={{ 
                color: 'text.secondary',
                fontStyle: 'italic'
              }}
            >
              {parsedContent.message}
            </Typography>
          </ErrorBoundary>
        );
      }
      
      // If JSON parsing succeeds but structure is unknown, return as text
      return (
        <ErrorBoundary>
          <Typography variant="body1" component="span">{text}</Typography>
        </ErrorBoundary>
      );
    } catch (e) {
      // If JSON parsing fails, return as plain text
      return (
        <ErrorBoundary>
          <Typography variant="body1" component="span">{text}</Typography>
        </ErrorBoundary>
      );
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar 
        position="static" 
        sx={{ 
          background: 'linear-gradient(45deg, #1e1e1e 30%, #2d2d2d 90%)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setIsDrawerOpen(true)}
            sx={{ 
              mr: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component="img"
            src={Logo}
            alt="UCS Chat Assistant"
            sx={{
              height: '32px',
              width: 'auto',
              objectFit: 'contain',
              mr: 2,
              display: 'block',
            }}
          />
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #fff 30%, #e0e0e0 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            UCS Chat Assistant
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<UploadFileIcon />}
            onClick={onNewUpload}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                transform: 'translateY(-2px)',
                transition: 'all 0.2s',
              },
            }}
          >
            Upload More
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 320,
            bgcolor: 'background.paper',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            Chat History
          </Typography>
        </Box>
        <List sx={{ p: 0 }}>
          {chats.map((chat) => (
            <ListItemButton
              key={chat.id}
              sx={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                },
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)' }}>
                  <ChatIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={chat.title}
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {formatTime(chat.lastUpdated)}
                    </Typography>
                  </Box>
                }
                primaryTypographyProps={{
                  sx: { fontWeight: 500 },
                }}
              />
              <IconButton
                size="small"
                sx={{
                  opacity: 0.5,
                  '&:hover': {
                    opacity: 1,
                    color: 'error.main',
                  },
                }}
              >
                <DeleteIcon />
              </IconButton>
            </ListItemButton>
          ))}
        </List>
        <Box sx={{ p: 2, mt: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ChatIcon />}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            New Chat
          </Button>
        </Box>
      </Drawer>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          bgcolor: 'background.default',
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      >
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              justifyContent: msg.isUser ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Paper
              sx={{
                p: 2,
                maxWidth: '70%',
                bgcolor: msg.isUser 
                  ? 'primary.dark'  // Darker blue for user messages
                  : 'background.paper',
                color: msg.isUser 
                  ? 'white' 
                  : 'text.primary',
                borderRadius: 2,
                boxShadow: 2,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  [msg.isUser ? 'right' : 'left']: 0,
                  width: '100%',
                  height: '100%',
                  background: msg.isUser 
                    ? 'linear-gradient(45deg, rgba(25, 118, 210, 0.1), rgba(25, 118, 210, 0.2))'  // Subtle gradient for user messages
                    : 'linear-gradient(45deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.1))',  // Subtle gradient for bot messages
                  borderRadius: 'inherit',
                  zIndex: 0,
                },
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <ErrorBoundary>
                  {/* Changed Typography component to render a 'div' instead of a 'p' */}
                  <Typography 
                    variant="body1" 
                    component="div" 
                    sx={{ 
                      fontWeight: 400,
                      lineHeight: 1.6,
                      '& a': {
                        color: msg.isUser ? 'white' : 'primary.main',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      },
                    }}
                  >
                    {renderMessageContent(msg.text)}
                  </Typography>
                </ErrorBoundary>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    opacity: 0.7, 
                    display: 'block', 
                    mt: 1,
                    color: msg.isUser ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary',
                  }}
                >
                  {formatTime(msg.timestamp)}
                </Typography>
              </Box>
            </Paper>
          </Box>
        ))}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <Paper
              sx={{
                p: 2,
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 2,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.1))',
                  borderRadius: 'inherit',
                  zIndex: 0,
                },
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 400,
                    color: 'text.secondary',
                  }}
                >
                  Thinking...
                </Typography>
              </Box>
            </Paper>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.default',
                '&:hover fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&.Mui-disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled',
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatInterface;
