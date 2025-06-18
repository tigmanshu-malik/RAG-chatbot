import { useState } from 'react';
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
import logo from '../assets/logo.png';

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

interface ChatInterfaceProps {
  onNewUpload: () => void;
}

const ChatInterface = ({ onNewUpload }: ChatInterfaceProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([
    { 
      id: 1, 
      title: 'Document Analysis', 
      messages: [],
      lastUpdated: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
    },
    { 
      id: 2, 
      title: 'Research Discussion', 
      messages: [],
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
    },
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

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now(),
        text: message,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
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
            src={logo}
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
              alignItems: 'flex-end',
              gap: 1,
              maxWidth: '85%',
              alignSelf: msg.isUser ? 'flex-end' : 'flex-start',
            }}
          >
            {!msg.isUser && (
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <ChatIcon sx={{ fontSize: 20 }} />
              </Avatar>
            )}
            <Paper
              sx={{
                p: 2,
                maxWidth: '100%',
                bgcolor: msg.isUser ? 'primary.main' : 'background.paper',
                color: msg.isUser ? 'primary.contrastText' : 'text.primary',
                borderRadius: 3,
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  [msg.isUser ? 'right' : 'left']: -8,
                  width: 16,
                  height: 16,
                  background: msg.isUser ? 'primary.main' : 'background.paper',
                  transform: 'rotate(45deg)',
                  zIndex: 0,
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  [msg.isUser ? 'right' : 'left']: -4,
                  width: 8,
                  height: 8,
                  background: msg.isUser ? 'primary.main' : 'background.paper',
                  transform: 'rotate(45deg)',
                  zIndex: 1,
                },
              }}
            >
              <Typography
                sx={{
                  position: 'relative',
                  zIndex: 2,
                  wordBreak: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.text}
              </Typography>
            </Paper>
            {msg.isUser && (
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.dark',
                }}
              >
                <Typography variant="body2">U</Typography>
              </Avatar>
            )}
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            maxWidth: 1200,
            mx: 'auto',
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                },
                '&.Mui-focused': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!message.trim()}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.15)',
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
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