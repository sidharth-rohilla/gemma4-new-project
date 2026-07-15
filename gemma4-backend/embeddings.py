from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
import config

def load_embedding_model() -> SentenceTransformer:
    return SentenceTransformer(config.EMBEDDING_MODEL_NAME)

def embed_doc(documents: list, model: SentenceTransformer) -> np.ndarray:
    text = [doc.page_content for doc in documents]
    embeddings = model.encode(text, show_progress_bar=True) 
    embeddings = np.asarray(embeddings, dtype=np.float32)
    faiss.normalize_L2(embeddings)
    return embeddings

def embed_query(query: str, embedding_model: SentenceTransformer) -> np.ndarray:
    embedded_query = embedding_model.encode([query])
    embedded_query = np.asarray(embedded_query, dtype=np.float32)
    faiss.normalize_L2(embedded_query)
    return embedded_query
