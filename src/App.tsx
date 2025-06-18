import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import DocumentUpload from './components/DocumentUpload';
import EmbeddingProgress from './components/EmbeddingProgress';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

function App() {
  const [isUploading, setIsUploading] = useState(true);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [embeddingProgress, setEmbeddingProgress] = useState(0);
  const [showUpload, setShowUpload] = useState(false);

  const handleUploadComplete = () => {
    setIsUploading(false);
    setIsEmbedding(true);
    // Simulate embedding progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setEmbeddingProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsEmbedding(false);
      }
    }, 500);
  };

  const handleNewUpload = () => {
    setShowUpload(true);
  };

  const handleUploadClose = () => {
    setShowUpload(false);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {isUploading ? (
        <DocumentUpload onUploadComplete={handleUploadComplete} />
      ) : isEmbedding ? (
        <EmbeddingProgress progress={embeddingProgress} />
      ) : (
        <>
          <ChatInterface onNewUpload={handleNewUpload} />
          {showUpload && (
            <DocumentUpload 
              onUploadComplete={() => {
                handleUploadComplete();
                handleUploadClose();
              }}
              onClose={handleUploadClose}
            />
          )}
        </>
      )}
    </ThemeProvider>
  );
}

export default App;
