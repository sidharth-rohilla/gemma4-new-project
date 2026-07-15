import os
import torch

BASE_OUTPUT_DIR = '/kaggle/working/'
MODEL_PATH = "/kaggle/input/gemma-2/transformers/gemma-2-9b-it/2"
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

MAX_NEW_TOKENS = 1024
TEMPERATURE = 0.2
DO_SAMPLE = True
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

CHUNK_SIZE = 500
CHUNK_OVERLAP = 100
TOP_K = 5
USE_GPU_FAISS = True
