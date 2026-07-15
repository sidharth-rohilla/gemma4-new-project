import faiss
import numpy as np
import torch
import os
import config

def create_faiss_index(embedded_document: np.ndarray) -> faiss.Index:
    dimension = len(embedded_document[0])
    index = faiss.IndexFlatIP(dimension)
    
    if config.USE_GPU_FAISS and torch.cuda.is_available():
        res = faiss.StandardGpuResources()
        index = faiss.index_cpu_to_gpu(res, 0, index)

    index.add(embedded_document)
    return index

def search_index(embedded_query: np.ndarray, index: faiss.Index, k: int = config.TOP_K):
    distance, indices = index.search(embedded_query, k)
    return distance, indices

def save_index(index: faiss.Index, doc_name: str):
    if isinstance(index, faiss.GpuIndex):
        index = faiss.index_gpu_to_cpu(index)
    faiss.write_index(index, os.path.join(config.BASE_OUTPUT_DIR, f'{doc_name}.faiss'))
    print(f'Index saved successfully to {config.BASE_OUTPUT_DIR}')

def load_index(doc_name: str) -> faiss.Index:
    index = faiss.read_index(os.path.join(config.BASE_OUTPUT_DIR, f'{doc_name}.faiss'))
    if config.USE_GPU_FAISS and torch.cuda.is_available():
        res = faiss.StandardGpuResources()
        index = faiss.index_cpu_to_gpu(res, 0, index)
    return index
