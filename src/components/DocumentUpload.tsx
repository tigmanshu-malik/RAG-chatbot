import { Box, Typography, Paper, Modal, IconButton } from '@mui/material';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import CloseIcon from '@mui/icons-material/Close';

interface DocumentUploadProps {
  onUploadComplete: () => void;
  onClose?: () => void;
}

const DocumentUpload = ({ onUploadComplete, onClose }: DocumentUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Here you would typically handle the file upload
    console.log(acceptedFiles);
    onUploadComplete();
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  const content = (
    <Paper
      {...getRootProps()}
      sx={{
        p: 4,
        width: '80%',
        maxWidth: 600,
        textAlign: 'center',
        cursor: 'pointer',
        bgcolor: 'background.paper',
        position: 'relative',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      {onClose && (
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      )}
      <input {...getInputProps()} />
      <Typography variant="h5" gutterBottom>
        {isDragActive
          ? 'Drop the files here...'
          : 'Drag and drop your documents here, or click to select files'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Supported formats: PDF, TXT, DOC, DOCX
      </Typography>
    </Paper>
  );

  if (onClose) {
    return (
      <Modal
        open={true}
        onClose={onClose}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {content}
      </Modal>
    );
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      {content}
    </Box>
  );
};

export default DocumentUpload; 