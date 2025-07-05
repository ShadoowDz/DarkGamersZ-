from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
import tempfile
import shutil
from pathlib import Path
import uuid
from datetime import datetime, timedelta
import asyncio
from typing import Optional

from fbx_to_mdl_converter import FBXToMDLConverter

app = FastAPI(title="FBX to CS 1.6 MDL Converter", description="Convert FBX files to Counter-Strike 1.6 MDL format")

# Setup static files and templates
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Create necessary directories
os.makedirs("static", exist_ok=True)
os.makedirs("templates", exist_ok=True)
os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

# Store conversion sessions
conversion_sessions = {}

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Serve the main converter interface"""
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/convert")
async def convert_fbx(file: UploadFile = File(...)):
    """Convert uploaded FBX file to CS 1.6 MDL format"""
    
    if not file.filename.lower().endswith('.fbx'):
        raise HTTPException(status_code=400, detail="Only FBX files are supported")
    
    # Generate unique session ID
    session_id = str(uuid.uuid4())
    
    # Create temporary directories for this conversion
    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, "input.fbx")
    output_path = os.path.join(temp_dir, "output.mdl")
    
    try:
        # Save uploaded file
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Initialize converter
        converter = FBXToMDLConverter()
        
        # Store session info
        conversion_sessions[session_id] = {
            "status": "processing",
            "input_path": input_path,
            "output_path": output_path,
            "temp_dir": temp_dir,
            "created_at": datetime.now(),
            "original_filename": file.filename
        }
        
        # Start conversion in background
        asyncio.create_task(perform_conversion(session_id, converter, input_path, output_path))
        
        return {"session_id": session_id, "status": "processing"}
        
    except Exception as e:
        # Cleanup on error
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

async def perform_conversion(session_id: str, converter: FBXToMDLConverter, input_path: str, output_path: str):
    """Perform the actual conversion in background"""
    try:
        # Run conversion
        result = await asyncio.get_event_loop().run_in_executor(
            None, converter.convert, input_path, output_path
        )
        
        if result["success"]:
            conversion_sessions[session_id]["status"] = "completed"
            conversion_sessions[session_id]["result"] = result
        else:
            conversion_sessions[session_id]["status"] = "failed"
            conversion_sessions[session_id]["error"] = result.get("error", "Unknown error")
            
    except Exception as e:
        conversion_sessions[session_id]["status"] = "failed"
        conversion_sessions[session_id]["error"] = str(e)

@app.get("/status/{session_id}")
async def get_conversion_status(session_id: str):
    """Get the status of a conversion session"""
    
    if session_id not in conversion_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = conversion_sessions[session_id]
    
    # Check if session is too old (cleanup after 1 hour)
    if datetime.now() - session["created_at"] > timedelta(hours=1):
        cleanup_session(session_id)
        raise HTTPException(status_code=404, detail="Session expired")
    
    return {
        "status": session["status"],
        "error": session.get("error"),
        "result": session.get("result", {})
    }

@app.get("/download/{session_id}")
async def download_converted_file(session_id: str):
    """Download the converted MDL file"""
    
    if session_id not in conversion_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = conversion_sessions[session_id]
    
    if session["status"] != "completed":
        raise HTTPException(status_code=400, detail="Conversion not completed")
    
    if not os.path.exists(session["output_path"]):
        raise HTTPException(status_code=404, detail="Converted file not found")
    
    # Generate output filename
    original_name = os.path.splitext(session["original_filename"])[0]
    output_filename = f"{original_name}.mdl"
    
    return FileResponse(
        session["output_path"],
        media_type="application/octet-stream",
        filename=output_filename
    )

def cleanup_session(session_id: str):
    """Clean up temporary files for a session"""
    if session_id in conversion_sessions:
        session = conversion_sessions[session_id]
        temp_dir = session.get("temp_dir")
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        del conversion_sessions[session_id]

@app.on_event("startup")
async def startup_event():
    """Clean up any existing temporary files on startup"""
    for temp_dir in [d for d in os.listdir("/tmp") if d.startswith("tmp") and "fbx_mdl" in d]:
        shutil.rmtree(os.path.join("/tmp", temp_dir), ignore_errors=True)

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up all sessions on shutdown"""
    for session_id in list(conversion_sessions.keys()):
        cleanup_session(session_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)