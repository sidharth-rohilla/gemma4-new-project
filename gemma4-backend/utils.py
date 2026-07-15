import os

def extract_text_from_audio(file_path: str) -> str:
    print(f"[Processing Audio: {file_path}]")
    return "This is placeholder text extracted from the audio file."

def extract_text_from_image(file_path: str) -> str:
    print(f"[Processing Image: {file_path}]")
    return "This is placeholder text extracted via OCR from the image."

def extract_text_from_video(file_path: str) -> str:
    print(f"[Processing Video: {file_path}]")
    return "This is placeholder text transcribed from the video."
