import logging
import uuid
from typing import List, Dict, Any
from qdrant_client import AsyncQdrantClient
from qdrant_client.http import models
from app.core.config import settings
from app.core.ollama import ollama_client

logger = logging.getLogger(__name__)

class VectorMemoryStore:
    def __init__(self):
        try:
            self.client = AsyncQdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
            self.collection_name = "maru_memories"
        except Exception as e:
            logger.warning(f"Qdrant client init deferred: {e}")
            self.client = None

    async def _ensure_collection(self):
        if not self.client:
            return
        try:
            collections = await self.client.get_collections()
            collection_names = [c.name for c in collections.collections]
            if self.collection_name not in collection_names:
                await self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE)
                )
                logger.info(f"Qdrant collection '{self.collection_name}' created.")
        except Exception as e:
            logger.warning(f"Failed to check/create Qdrant collection: {e}")

    async def add_memory(self, memory_id: str, text: str, metadata: Dict[str, Any]):
        if not self.client:
            return
        try:
            await self._ensure_collection()
            vector = await ollama_client.get_embeddings(text)
            if not vector or len(vector) != 768:
                logger.warning(f"Embedding failed or wrong dimension for text: {text[:20]}...")
                return

            await self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    models.PointStruct(
                        id=str(uuid.uuid4()),
                        vector=vector,
                        payload={"text": text, **metadata}
                    )
                ]
            )
        except Exception as e:
            logger.error(f"Error saving to Qdrant: {e}")

    async def search_memories(self, query_text: str, limit: int = 5) -> List[Dict[str, Any]]:
        if not self.client:
            return []
        try:
            await self._ensure_collection()
            vector = await ollama_client.get_embeddings(query_text)
            if not vector or len(vector) != 768:
                return []

            results = await self.client.search(
                collection_name=self.collection_name,
                query_vector=vector,
                limit=limit
            )
            return [hit.payload for hit in results]
        except Exception as e:
            logger.error(f"Error searching Qdrant: {e}")
            return []

vector_store = VectorMemoryStore()
