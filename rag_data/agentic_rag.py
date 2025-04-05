# agentic_rag.py
from __future__ import annotations

import os
import sys
import asyncio
from dataclasses import dataclass
from typing import List, Dict, Any
from dotenv import load_dotenv

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.schema import Document
from sentence_transformers import SentenceTransformer

from pydantic_ai import Agent, RunContext
from pydantic_ai.models.groq import GroqModel
from pydantic_ai.providers.groq import GroqProvider

# Load environment variables
load_dotenv()

# Constants
FAISS_INDEX_FOLDER = os.path.join(os.path.expanduser("~"), "OneDrive", "Documents", "consultadd", "rag_data", "faiss_indexes")

# Check for required environment variables
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in environment variables")

@dataclass
class Deps:
    """Dependencies for the agent"""
    collection_name: str


# Initialize the model and agent
model = GroqModel(
    'llama-3.3-70b-versatile',  # Use your preferred Groq model
    provider=GroqProvider(api_key=GROQ_API_KEY)
)

agent = Agent(  
    model,
    system_prompt="You are an AI assistant that provides comprehensive answers based on the retrieved document content. Be sure to answer accurately and cite the specific sections you're referencing."
)


@agent.tool
async def retrieve(context: RunContext[Deps], search_query: str) -> str:
    """
    Retrieve relevant document sections based on a search query using FAISS.
    
    Args:
        context: The call context with the collection name.
        search_query: The search query.
        
    Returns:
        Retrieved document sections as formatted text.
    """
    collection_name = context.deps.collection_name
    
    print(f"Retrieving documents for: '{search_query}' from collection: {collection_name}")
    
    # Initialize embedding model
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={'device': 'cpu'}
    )
    
    # Load FAISS index
    index_path = os.path.join(FAISS_INDEX_FOLDER, collection_name)
    
    if not os.path.exists(index_path):
        return f"Error: FAISS index not found for collection '{collection_name}'."
    
    try:
        # Load the vector store
        vectorstore = FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)
        
        # Perform similarity search
        docs = vectorstore.similarity_search(search_query, k=5)
        
        # Format the retrieved documents
        results = []
        for i, doc in enumerate(docs):
            chunk_id = doc.metadata.get("chunk_id", i)
            source = doc.metadata.get("source", collection_name)
            results.append(f"## Document Section {i+1}\nSource: {source}, Chunk: {chunk_id}\n\n{doc.page_content}\n")
        
        if not results:
            return "No relevant documents found for the query."
        
        return "\n\n".join(results)
    
    except Exception as e:
        return f"Error retrieving documents: {str(e)}"


@agent.tool
async def list_collections() -> str:
    """
    List all available document collections.
    
    Returns:
        List of available collection names.
    """
    if not os.path.exists(FAISS_INDEX_FOLDER):
        return "Error: FAISS index folder not found."
    
    collections = [d for d in os.listdir(FAISS_INDEX_FOLDER) 
                  if os.path.isdir(os.path.join(FAISS_INDEX_FOLDER, d))]
    
    if not collections:
        return "No document collections available. Please run rag_pipeline.py first to process documents."
    
    return "Available collections:\n" + "\n".join([f"- {collection}" for collection in collections])


async def run_agent(query: str, collection_name: str):
    """
    Run the agent with the given query and collection.
    
    Args:
        query: The user's question.
        collection_name: The collection to search.
    """
    print(f"Running query: '{query}' on collection: '{collection_name}'")
    
    deps = Deps(collection_name=collection_name)
    response = await agent.run(query, deps=deps)
    
    print("\n==== Response ====")
    print(response)
    print(type(response))


async def main_async():
    """Main async function to run the RAG application"""
    # Check for available collections
    if not os.path.exists(FAISS_INDEX_FOLDER):
        print(f"FAISS index folder not found: {FAISS_INDEX_FOLDER}")
        print("Please run rag_pipeline.py first to process documents.")
        return
    
    collections = [d for d in os.listdir(FAISS_INDEX_FOLDER) 
                  if os.path.isdir(os.path.join(FAISS_INDEX_FOLDER, d))]
    
    if not collections:
        print("No document collections available. Please run rag_pipeline.py first to process documents.")
        return
    
    # List available collections
    print("Available document collections:")
    for i, collection in enumerate(collections):
        print(f"{i+1}. {collection}")
    
    # Select collection
    collection_idx = input("\nSelect collection number: ")
    try:
        idx = int(collection_idx) - 1
        if 0 <= idx < len(collections):
            collection_name = collections[idx]
        else:
            print("Invalid selection. Please enter a valid number.")
            return
    except ValueError:
        print("Invalid input. Please enter a number.")
        return
    
    print(f"\nSelected collection: {collection_name}")
    
    # Get user query
    query = input("\nEnter your question: ")
    
    if not query.strip():
        print("No query provided. Exiting.")
        return
    
    # Run the agent
    await run_agent(query, collection_name)


def main():
    """Entry point for the script"""
    asyncio.run(main_async())


if __name__ == "__main__":
    main()