import os
import sys
import subprocess
import time
from pathlib import Path

def main():
    root = Path(__file__).resolve().parent
    python_exe = root / "venv" / "Scripts" / "python.exe"
    
    if not python_exe.exists():
        print(f"Error: Python virtual environment not found at {python_exe}")
        sys.exit(1)

    print("==================================================")
    print("       CORVYN CYBER FRAUD FORENSIC PIPELINE       ")
    print("==================================================")
    print("1. Launching FastAPI Backend on http://127.0.0.1:8000 ...")
    
    env = os.environ.copy()
    env["PYTHONPATH"] = str(root)
    
    backend_proc = subprocess.Popen(
        [str(python_exe), "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=str(root),
        env=env,
    )

    time.sleep(2)

    print("2. Launching Vite React Frontend on http://localhost:5173 ...")
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=str(root / "frontend"),
        shell=True,
    )

    print("\nBoth servers running!")
    print("Press Ctrl+C to terminate both servers.")

    try:
        backend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping Corvyn...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()
