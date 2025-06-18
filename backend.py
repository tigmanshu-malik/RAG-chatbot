from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from pathlib import Path
import shutil
from typing import List
import json
from code import process_query, ensure_docs_directory

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    try:
        docs_dir = ensure_docs_directory()
        
        # Clear existing files
        for file in docs_dir.glob("*"):
            if file.is_file():
                file.unlink()
        
        # Save new files
        for file in files:
            file_path = docs_dir / file.filename
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        
        return {"status": "success", "message": f"Successfully uploaded {len(files)} files"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
async def query_endpoint(request: QueryRequest):
    try:
        result = process_query(request.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("backend:app", host="0.0.0.0", port=8000, reload=True) 