from langchain_community.document_loaders import PyMuPDFLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
import pickle
import os
import config

def read_all_pdf(documents: list[str]) -> list[Document]:
    all_doc = []
    for document in documents:
        loader = PyMuPDFLoader(document)
        doc = loader.load()
        all_doc.extend(doc)
    return all_doc

def chunking(documents: list[Document]) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=config.CHUNK_SIZE, 
        chunk_overlap=config.CHUNK_OVERLAP
    )
    return splitter.split_documents(documents)

def save_documents(documents: list[Document], file_name: str):
    full_path = os.path.join(config.BASE_OUTPUT_DIR, file_name)
    with open(full_path, 'wb') as f:
        pickle.dump(documents, f)

def load_documents(file_name: str) -> list[Document]:
    full_path = os.path.join(config.BASE_OUTPUT_DIR, file_name)
    with open(full_path, 'rb') as f:
        return pickle.load(f)
