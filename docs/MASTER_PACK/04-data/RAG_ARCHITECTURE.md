# RAG Architecture Document

## Overview
This document outlines the Retrieval-Augmented Generation (RAG) architecture for Namasoft ERP.

## Embedding Model
- **Model**: `text-embedding-004` (Google Gemini) or equivalent
- **Dimensions**: 768
- **Cost**: Estimated $0.02 per 1M tokens

## Chunking Strategy
- **Size**: 500 tokens
- **Overlap**: 50 tokens
- **Splitter**: RecursiveCharacterTextSplitter
- **Metadata**: Each chunk includes `tenantId`, `source`, `module`, and `date`.

## Vector Index Structure
- **Storage**: PostgreSQL with `pgvector` extension
- **Index Type**: HNSW (Hierarchical Navigable Small World) for fast ANN search
- **Distance Metric**: Cosine Similarity

## Tenant Isolation Strategy
Strict namespace filtering is applied. Every query to the vector store MUST include `filter: { tenantId: "X" }`.
Chunks ingested without a `tenantId` are rejected by the ingestion pipeline.

## Retrieval & Reranking
- **Initial Retrieval**: Top 20 chunks fetched from `pgvector`
- **Reranker**: Cross-Encoder (e.g., Cohere Rerank or Gemini Rerank)
- **Final Top-K**: Top 8 chunks selected after reranking
- **Token Budget**: Max 4,000 tokens allocated for retrieved context.

## Citation Tracking
- Each generated response includes an array of `citations`.
- The Tracker logs the `query_hash`, `cited_chunks`, and the inferred `response_quality` to `AuditLog`.
