# filepath: /rag-web-app/rag-web-app/backend/python/code.py
import os
import google.generativeai as genai
import faiss
import numpy as np
import tiktoken
from dotenv import load_dotenv
import PyPDF2
from docx import Document

load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    raise ValueError("GOOGLE_API_KEY environment variable not set. Please create a .env file.")

genai.configure(api_key=API_KEY)

DOCS_FOLDER = "docs"
EMBEDDING_MODEL = "text-embedding-004"
GENERATION_MODEL = "gemini-2.0-flash"

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

def extract_text_from_pdf(filepath):
    text = ""
    try:
        with open(filepath, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                text += page.extract_text() or ""
        return text
    except Exception as e:
        print(f"Error extracting text from PDF '{filepath}': {e}")
        return ""

def extract_text_from_docx(filepath):
    text = ""
    try:
        document = Document(filepath)
        for paragraph in document.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        print(f"Error extracting text from DOCX '{filepath}': {e}")
        return ""

def load_documents(folder_path):
    documents = []
    print(f"Searching for .txt, .pdf, and .docx documents in '{folder_path}'...")
    for filename in os.listdir(folder_path):
        filepath = os.path.join(folder_path, filename)
        try:
            if filename.endswith(".txt"):
                with open(filepath, "r", encoding="utf-8") as f:
                    documents.append(f.read())
                print(f"Loaded (TXT): {filename}")
            elif filename.endswith(".pdf"):
                text = extract_text_from_pdf(filepath)
                if text:
                    documents.append(text)
                    print(f"Loaded (PDF): {filename}")
            elif filename.endswith(".docx"):
                text = extract_text_from_docx(filepath)
                if text:
                    documents.append(text)
                    print(f"Loaded (DOCX): {filename}")
            else:
                print(f"Skipping unknown file type: {filename}")
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    return documents

def chunk_text(text, chunk_size, chunk_overlap):
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start += chunk_size - chunk_overlap
        if start < 0:
            start = 0
    return chunks

def get_embeddings(texts):
    embeddings = []
    for i, text in enumerate(texts):
        response = genai.embed_content(
            model=EMBEDDING_MODEL,
            content=text,
            task_type="RETRIEVAL_DOCUMENT"
        )
        embeddings.append(response['embedding'])
        print(f"Generated embedding for chunk {i+1}/{len(texts)}")
    return np.array(embeddings).astype('float32')

def build_faiss_index(embeddings):
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    return index

def retrieve_chunks(query, faiss_index, all_chunks, top_k=3):
    query_embedding_response = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=query,
        task_type="RETRIEVAL_QUERY"
    )
    query_embedding = np.array([query_embedding_response['embedding']]).astype('float32')
    distances, indices = faiss_index.search(query_embedding, top_k)
RAG Chat Interface
￼￼Submit
    retrieved_chunks = [all_chunks[i] for i in indices[0]]
    return retrieved_chunks

def generate_response(query, retrieved_chunks):
    model = genai.GenerativeModel(GENERATION_MODEL)
    context = "\n\n".join(retrieved_chunks)
    prompt = f"""
Based on the following information, please answer the query.
If the information does not contain the answer, state that you don't have enough information.

Information:
---
{context}
---

Query: {query}

Answer:
"""
    try:
        response = model.generate_content(prompt)
        if response.candidates and response.candidates[0].content:
            return response.candidates[0].content.parts[0].text
        else:
            return "Could not generate a response based on the provided information."
    except Exception as e:
        return f"An error occurred during generation: {e}"

def main():
    print("Starting RAG application...")
    documents = load_documents(DOCS_FOLDER)
    if not documents:
        print(f"No .txt, .pdf, or .docx documents found in '{DOCS_FOLDER}'. Please add some documents to get started.")
        return

    print("Chunking documents...")
    all_chunks = []
    for i, doc in enumerate(documents):
        chunks = chunk_text(doc, CHUNK_SIZE, CHUNK_OVERLAP)
        all_chunks.extend(chunks)
        print(f"Document {i+1} yielded {len(chunks)} chunks.")

    if not all_chunks:
        print("No chunks were generated. This might happen if your documents are empty or too small.")
        return

    print(f"Generating embeddings for {len(all_chunks)} chunks. This might take a moment...")
    embeddings = get_embeddings(all_chunks)
    print("Embeddings generated.")

    print("Building FAISS index...")
    faiss_index = build_faiss_index(embeddings)
    print("FAISS index built successfully.")

    print("\nRAG system initialized. You can now ask questions based on your documents.")
    print("Type 'exit' to quit.")

    while True:
        query = input("\nEnter your query: ")
        if query.lower() == 'exit':
            print("Exiting RAG application. Goodbye!")
            break

        print("Retrieving relevant information...")
        retrieved_chunks = retrieve_chunks(query, faiss_index, all_chunks)

        if not retrieved_chunks:
            print("No relevant chunks found for your query. Try a different query.")
            continue

        print("\n--- Retrieved Information (Top Chunks) ---")
        for i, chunk in enumerate(retrieved_chunks):
            print(f"Chunk {i+1}:\n{chunk[:300]}...\n")
        print("------------------------------------------")

        print("Generating response...")
        response = generate_response(query, retrieved_chunks)

        print("\n--- Generated Response ---")
        print(response)
        print("--------------------------")

if __name__ == "__main__":
    main()