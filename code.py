import os
import sys
import json
import shutil
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai
from langchain.text_splitter import RecursiveCharacterTextSplitter
import numpy as np
from PyPDF2 import PdfReader
from docx import Document

# Load environment variables
load_dotenv()

# Debug environment
print("Python environment check:", file=sys.stderr)
print(f"Current working directory: {os.getcwd()}", file=sys.stderr)
print(f"GOOGLE_API_KEY is set: {bool(os.getenv('GOOGLE_API_KEY'))}", file=sys.stderr)

# Configure Google API
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    print("Error: GOOGLE_API_KEY environment variable is not set", file=sys.stderr)
    sys.exit(1)

try:
    genai.configure(api_key=GOOGLE_API_KEY)
    # Changed model to 'gemini-2.0-flash' which is generally more available
    model = genai.GenerativeModel('gemini-2.0-flash') 
    # The embedding model doesn't need to be instantiated as GenerativeModel
    # as genai.embed_content is a top-level function.
    print("Successfully configured Google API", file=sys.stderr)
except Exception as e:
    print(f"Error configuring Google API: {str(e)}", file=sys.stderr)
    sys.exit(1)

def ensure_docs_directory():
    """Ensure the docs directory exists."""
    docs_dir = Path(__file__).parent / 'docs'
    print(f"Docs directory path: {docs_dir}", file=sys.stderr)
    if not docs_dir.exists():
        print("Creating docs directory", file=sys.stderr)
        docs_dir.mkdir(parents=True)
    return docs_dir

def extract_text_from_pdf(file_path):
    """Extract text from a PDF file."""
    try:
        print(f"Extracting text from PDF: {file_path}", file=sys.stderr)
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error extracting text from PDF: {str(e)}", file=sys.stderr)
        return ""

def extract_text_from_docx(file_path):
    """Extract text from a DOCX file."""
    try:
        print(f"Extracting text from DOCX: {file_path}", file=sys.stderr)
        doc = Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text.strip()
    except Exception as e:
        print(f"Error extracting text from DOCX: {str(e)}", file=sys.stderr)
        return ""

def load_documents(docs_dir):
    """Load and process documents from the docs directory."""
    if not docs_dir.exists():
        print("Docs directory does not exist", file=sys.stderr)
        return []

    documents = []
    for file_path in docs_dir.glob('*'):
        print(f"Processing file: {file_path}", file=sys.stderr)
        if file_path.suffix.lower() == '.pdf':
            text = extract_text_from_pdf(str(file_path))
            if text:
                documents.append(text)
        elif file_path.suffix.lower() == '.docx':
            text = extract_text_from_docx(str(file_path))
            if text:
                documents.append(text)

    if not documents:
        print("No documents found in the docs directory", file=sys.stderr)
        return []

    print(f"Found {len(documents)} documents", file=sys.stderr)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    chunks = text_splitter.split_text('\n'.join(documents))
    print(f"Split documents into {len(chunks)} chunks", file=sys.stderr)
    return chunks

def get_embeddings(texts):
    """Get embeddings for a list of texts using Gemini's embedding model."""
    try:
        print(f"Getting embeddings for {len(texts)} chunks", file=sys.stderr)
        embeddings = []
        for i, text in enumerate(texts):
            print(f"Getting embedding for chunk {i+1}/{len(texts)}", file=sys.stderr)
            # Corrected: Use genai.embed_content directly with the model name
            response = genai.embed_content(
                model="models/embedding-001", # Specify the embedding model here
                content=text,
                task_type="retrieval_document",
                title="Document chunk"
            )
            embeddings.append(response['embedding']) # Access the 'embedding' key from the response
        return embeddings
    except Exception as e:
        print(f"Error getting embeddings: {str(e)}", file=sys.stderr)
        return []

def find_most_similar_chunks(query_embedding, chunk_embeddings, texts, k=3):
    """Find the most similar chunks using cosine similarity."""
    try:
        similarities = []
        query_embedding = np.array(query_embedding)
        
        for chunk_embedding in chunk_embeddings:
            chunk_embedding = np.array(chunk_embedding)
            # Calculate cosine similarity
            similarity = np.dot(query_embedding, chunk_embedding) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(chunk_embedding)
            )
            similarities.append(similarity)
        
        # Get indices of top k similar chunks
        top_k_indices = np.argsort(similarities)[-k:][::-1]
        return [texts[i] for i in top_k_indices]
    except Exception as e:
        print(f"Error finding similar chunks: {str(e)}", file=sys.stderr)
        return []

def process_query(query):
    """Process a query and return the response."""
    try:
        print(f"Processing query: {query}", file=sys.stderr)
        
        # Ensure docs directory exists
        docs_dir = ensure_docs_directory()
        
        # Load and process documents
        chunks = load_documents(docs_dir)
        if not chunks:
            return {
                'status': 'error',
                'message': 'No documents found. Please upload some documents first.'
            }

        # Get embeddings for chunks
        chunk_embeddings = get_embeddings(chunks)
        if not chunk_embeddings:
            return {
                'status': 'error',
                'message': 'Error processing documents. Please try uploading them again.'
            }

        # Get query embedding
        # When embedding a query, the task_type should be "retrieval_query"
        query_embedding_response = genai.embed_content(
            model="models/embedding-001",
            content=query,
            task_type="retrieval_query"
        )
        query_embedding = query_embedding_response['embedding']
        
        # Find most similar chunks
        relevant_chunks = find_most_similar_chunks(query_embedding, chunk_embeddings, chunks)
        if not relevant_chunks:
            return {
                'status': 'error',
                'message': 'Error retrieving relevant information. Please try again.'
            }

        # Generate response
        context = "\n".join(relevant_chunks)
        prompt = f"""Based on the following context, please answer the question. If the answer cannot be found in the context, say so.

Context:
{context}

Question: {query}

Answer:"""
        
        response = model.generate_content(prompt)
        
        return {
            'status': 'success',
            'answer': response.text
        }
    except Exception as e:
        print(f"Error processing query: {str(e)}", file=sys.stderr)
        return {
            'status': 'error',
            'message': 'An unexpected error occurred. Please try again.'
        }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({
            'status': 'error',
            'message': 'Query argument is required'
        }))
        sys.exit(1)

    query = sys.argv[1]
    result = process_query(query)
    print(json.dumps(result))
