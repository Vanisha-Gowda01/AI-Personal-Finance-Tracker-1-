@echo off
echo Starting Personal Finance AI Tracker Backend...
set OPENBLAS_NUM_THREADS=1
set PYTHONUNBUFFERED=1
venv\Scripts\python.exe app.py
