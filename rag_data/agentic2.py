# agentic_rag.py
from __future__ import annotations

import os
import sys
import asyncio
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.retrievers import BM25Retriever, EnsembleRetriever
from langchain.retrievers.document_compressors import CohereRerank
from langchain.retrievers import ContextualCompressionRetriever
from langchain.schema import Document

from pydantic_ai import Agent, RunContext
from pydantic_ai.models.groq import GroqModel
from pydantic_ai.providers.groq import GroqProvider

# Load environment variables
load_dotenv()

# Constants
FAISS_INDEX_FOLDER = os.path.join(
    os.path.expanduser("~"),
    "OneDrive",
    "Documents",
    "consultadd",
    "rag_data",
    "faiss_indexes"
)
MAX_CHUNKS_SUMMARY = 25  # Maximum chunks for summarization
MAX_CHUNKS_ELIGIBILITY = 50  # Maximum chunks for eligibility checks
RERANKING_ENABLED = False  # Set to True if you have a Cohere API key

# Check for required environment variables
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in environment variables")

# Check for optional Cohere API key for reranking
COHERE_API_KEY = os.environ.get("COHERE_API_KEY")
if COHERE_API_KEY:
    RERANKING_ENABLED = True
    os.environ["COHERE_API_KEY"] = COHERE_API_KEY
else:
    print("Warning: COHERE_API_KEY not found. Reranking will be disabled.")

# Pydantic models for structured outputs
class DocumentSummary(BaseModel):
    """Document summary model"""
    context: str = Field(..., description="Overall context and purpose of the document")
    scope_of_work: str = Field(..., description="Description of the work or services being requested")
    key_points: List[str] = Field(..., description="Key points about the document")
    document_type: str = Field(..., description="Type of the document (RFP, proposal, contract, etc.)")

class EligibilityCriteria(BaseModel):
    """Eligibility criteria model"""
    mandatory_requirements: List[str] = Field(..., description="List of all mandatory requirements")
    qualifications: List[str] = Field(..., description="Required qualifications")
    certifications: List[str] = Field(..., description="Required certifications")
    experience: List[str] = Field(..., description="Required experience")
    missing_criteria: List[str] = Field(..., description="Potentially missing or unclear criteria")
    recommendation: str = Field(..., description="Overall assessment of the eligibility requirements")

# Document retrieval functions
async def retrieve_document_chunks(collection_name: str, is_summary: bool = True) -> str:
    """
    Retrieve document content based on task type.
    For summary: Uses first N chunks in order.
    
    Args:
        collection_name: The collection name to retrieve from.
        is_summary: Whether this is for summarization (True) or eligibility check (False).
        
    Returns:
        The document content.
    """
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

        if is_summary:
            # For summarization: get the first N chunks in document order
            docs = []
            for doc_id in vectorstore.docstore._dict:
                doc = vectorstore.docstore._dict[doc_id]
                if hasattr(doc, "page_content") and hasattr(doc, "metadata"):
                    docs.append(doc)
            
            # Sort by chunk_id to maintain document order
            docs.sort(key=lambda x: x.metadata.get("chunk_id", 0))
            selected_docs = docs[:MAX_CHUNKS_SUMMARY]
            
            # Format the retrieved documents
            results = []
            for i, doc in enumerate(selected_docs):
                chunk_id = doc.metadata.get("chunk_id", i)
                source = doc.metadata.get("source", collection_name)
                results.append(f"## Document Section {i+1}\nSource: {source}, Chunk: {chunk_id}\n\n{doc.page_content}\n")
            
            return "\n\n".join(results)
        else:
            # For eligibility: get all chunks
            docs = []
            for doc_id in vectorstore.docstore._dict:
                doc = vectorstore.docstore._dict[doc_id]
                if hasattr(doc, "page_content") and hasattr(doc, "metadata"):
                    docs.append(doc)
            
            # Format the retrieved documents
            results = []
            for i, doc in enumerate(docs):
                chunk_id = doc.metadata.get("chunk_id", i)
                source = doc.metadata.get("source", collection_name)
                results.append(f"## Document Section {i+1}\nSource: {source}, Chunk: {chunk_id}\n\n{doc.page_content}\n")
            
            return "\n\n".join(results)

    except Exception as e:
        import traceback
        print(f"Error retrieving document chunks: {str(e)}")
        print(traceback.format_exc())
        return f"Error retrieving document chunks: {str(e)}"

async def semantic_search_retrieval(collection_name: str, query: str, top_k: int = 10) -> str:
    """
    Perform semantic search on document collection and retrieve most relevant chunks.
    
    Args:
        collection_name: The collection to search in
        query: The search query for semantic matching
        top_k: Number of top results to retrieve
        
    Returns:
        Formatted text with the most relevant document chunks
    """
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
        
        # Set up retriever
        retriever_vectordb = vectorstore.as_retriever(search_kwargs={"k": top_k})
        
        # Get all documents to create BM25 retriever
        all_docs = []
        for doc_id in vectorstore.docstore._dict:
            doc = vectorstore.docstore._dict[doc_id]
            if hasattr(doc, "page_content") and hasattr(doc, "metadata"):
                all_docs.append(Document(
                    page_content=doc.page_content,
                    metadata=doc.metadata
                ))
        
        # Create BM25 retriever for keyword-based search
        keyword_retriever = BM25Retriever.from_documents(all_docs)
        keyword_retriever.k = top_k
        
        # Create ensemble retriever for hybrid search
        ensemble_retriever = EnsembleRetriever(
            retrievers=[retriever_vectordb, keyword_retriever],
            weights=[0.7, 0.3]  # Prioritize semantic search over keyword matching
        )
        
        # Apply reranking if enabled
        if RERANKING_ENABLED:
            compressor = CohereRerank()
            final_retriever = ContextualCompressionRetriever(
                base_compressor=compressor,
                base_retriever=ensemble_retriever
            )
        else:
            final_retriever = ensemble_retriever
        
        # Get relevant documents
        docs = final_retriever.get_relevant_documents(query)
        
        # Format the retrieved documents
        results = []
        for i, doc in enumerate(docs):
            chunk_id = doc.metadata.get("chunk_id", i)
            source = doc.metadata.get("source", collection_name)
            results.append(f"## Document Section {i+1}\nSource: {source}, Chunk: {chunk_id}\n\n{doc.page_content}\n")
        
        if not results:
            return "No relevant document chunks found."
        
        return "\n\n".join(results)
        
    except Exception as e:
        import traceback
        print(f"Error in semantic search: {str(e)}")
        print(traceback.format_exc())
        return f"Error performing semantic search: {str(e)}"

@dataclass
class SummaryDeps:
    """Dependencies for the summary agent"""
    collection_name: str

@dataclass
class EligibilityDeps:
    """Dependencies for the eligibility agent"""
    collection_name: str

# Initialize agents
def create_summary_agent():
    """Create and configure the document summarization agent"""
    model = GroqModel(
        'llama-3.1-8b-instant',  # Using smaller model to reduce token usage
        provider=GroqProvider(api_key=GROQ_API_KEY)
    )
    
    agent = Agent(
        model,
        system_prompt=(
            "You are a specialized document summarization assistant. Your task is to generate a comprehensive yet concise "
            "summary of a document. Follow these steps:\n"
            "1. Analyze the document content provided to understand its purpose and structure.\n"
            "2. Extract the core context, scope of work, and key points.\n"
            "3. Create a structured summary that includes:\n"
            "   - Overall context and purpose of the document\n"
            "   - Description of the work or services being requested\n"
            "   - Key points about requirements, deliverables, and important details\n"
            "   - Type of the document (RFP, contract, proposal, etc.)\n"
            "4. Present your summary in a clear, structured format.\n\n"
            "Your summary should be factual, objective, and based solely on the provided document content."
        )
    )
    
    @agent.tool
    async def get_document_content(context: RunContext[SummaryDeps]) -> str:
        """
        Retrieve ordered document content for summarization (first N chunks).
        
        Args:
            context: The context with collection name.
            
        Returns:
            The document content in original order.
        """
        collection_name = context.deps.collection_name
        content = await retrieve_document_chunks(collection_name, is_summary=True)
        return content
    
    return agent

def create_eligibility_agent():
    """Create and configure the eligibility criteria extraction agent"""
    model = GroqModel(
        'llama-3.1-8b-instant',  # Using smaller model to reduce token usage
        provider=GroqProvider(api_key=GROQ_API_KEY)
    )

    agent = Agent(
        model,
        system_prompt=(
            "You are a specialized eligibility criteria extraction assistant. Your task is to analyze documents and identify "
            "all mandatory eligibility requirements. Follow these steps:\n"
            "1. Carefully review the document content provided.\n"
            "2. Extract and list all mandatory requirements, focusing on:\n"
            "   - Required qualifications and credentials\n"
            "   - Required certifications or licenses\n"
            "   - Minimum experience requirements\n"
            "   - Technical capabilities or resources needed\n"
            "3. Flag any missing or unclear eligibility criteria that should be specified but aren't.\n"
            "4. Provide a structured output with all mandatory requirements and flagged missing elements.\n"
            "5. Include a brief assessment of the overall eligibility requirements (strict, standard, minimal, etc.).\n\n"
            "Focus specifically on requirements using language like 'must have', 'required', 'shall', or 'mandatory'."
        )
    )

    @agent.tool
    async def search_document_content(context: RunContext[EligibilityDeps], search_query: str) -> str:
        """
        Search the document for specific content related to eligibility criteria.
        
        Args:
            context: The context with collection name.
            search_query: The specific query to search for in the document.
            
        Returns:
            The relevant document sections matching the search query.
        """
        collection_name = context.deps.collection_name
        
        # Define specific queries for eligibility components
        if not search_query or search_query.strip() == "":
            # Default query if none provided
            search_query = "mandatory required must shall eligibility qualifications certifications experience requirements"
        
        results = await semantic_search_retrieval(collection_name, search_query, top_k=10)
        return results

    return agent

async def run_summary_agent(collection_name: str) -> str:
    """
    Run the summary agent on the specified collection.
    """
    print(f"Generating summary for document collection: {collection_name}")
    
    agent = create_summary_agent()
    deps = SummaryDeps(collection_name=collection_name)
    
    # Optimized prompt template for summarization
    summarization_prompt = (
        "Please provide a comprehensive summary of the document. First, retrieve the document content using the get_document_content tool, "
        "then analyze it to extract the overall context, scope of work, key points, and document type. "
        "Structure your response clearly with appropriate headings for each section."
    )
    
    try:
        response = await agent.run(summarization_prompt, deps=deps)
        
        print("\n==== Document Summary ====")
        print(response.content)
        
        return response.content
    except Exception as e:
        import traceback
        print(f"Error running summary agent: {str(e)}")
        print(traceback.format_exc())
        return f"Error generating summary: {str(e)}"

async def run_eligibility_agent(collection_name: str) -> str:
    """
    Run the eligibility agent on the specified collection with semantic search capabilities.
    """
    print(f"\nExtracting eligibility criteria for document collection: {collection_name}")

    agent = create_eligibility_agent()
    deps = EligibilityDeps(collection_name=collection_name)

    # Optimized prompt template for eligibility criteria extraction with semantic search
    eligibility_prompt = (
        "You need to extract all mandatory eligibility criteria from the document. Follow these steps:\n\n"
        
        "1. First, use the search_document_content tool to search for 'mandatory requirements qualifications certifications' to find the most relevant sections.\n\n"
        
        "2. Then, search specifically for 'experience requirements technical capabilities' to find additional criteria.\n\n"
        
        "3. If needed, search for 'eligibility criteria must shall necessary' to find any additional requirements.\n\n"
        
        "4. Provide a structured analysis of all mandatory eligibility requirements, organizing them into categories:\n"
        "   - Mandatory requirements\n"
        "   - Required qualifications\n"
        "   - Required certifications\n"
        "   - Minimum experience\n"
        "   - Technical capabilities\n\n"
        
        "5. Also identify any missing or ambiguous eligibility criteria and provide a recommendation about the strictness of the requirements.\n\n"
        
        "Focus specifically on requirements using language like 'must have', 'required', 'shall', or 'mandatory'."
    )

    try:
        response = await agent.run(eligibility_prompt, deps=deps)
        
        print("\n==== Eligibility Criteria ====")
        print(response.data)
        
        return response.data
    except Exception as e:
        import traceback
        print(f"Error running eligibility agent: {str(e)}")
        print(traceback.format_exc())
        return f"Error extracting eligibility criteria: {str(e)}"

async def list_available_collections() -> List[str]:
    """List all available document collections."""
    if not os.path.exists(FAISS_INDEX_FOLDER):
        return []
    
    return [
        d for d in os.listdir(FAISS_INDEX_FOLDER)
        if os.path.isdir(os.path.join(FAISS_INDEX_FOLDER, d))
    ]

async def main_async():
    """Main async function to run the RAG application"""
    # Check for available collections
    collections = await list_available_collections()
    
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
    
    # Select action
    print("\nSelect an action:")
    print("1. Generate Document Summary")
    print("2. Extract Eligibility Criteria")
    action = input("Enter your choice (1 or 2): ")
    
    if action == "1":
        await run_summary_agent(collection_name)
    elif action == "2":
        await run_eligibility_agent(collection_name)
    else:
        print("Invalid action. Please enter 1 or 2.")

def main():
    """Entry point for the script"""
    asyncio.run(main_async())

if __name__ == "__main__":
    main()