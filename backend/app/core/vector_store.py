import logging
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http import models
from app.core.config import settings

logger = logging.getLogger(__name__)

class VectorMemoryStore:
    def __init__(self):
        try:
            self.client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
            self.collection_name = "maru_memories"
            self._ensure_collection()
        except Exception as e:
            logger.warning(f"Qdrant client init deferred: {e}")
            self.client = None

    def _ensure_collection(self):
        if not self.client:
            return
        try:
            collections = [c.name for c in self.client.get_collections().collections]
            if self.collection_name not in collections:
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(size=384, distance=models.Distance.COSINE)
                )
                logger.info(f"Qdrant collection '{self.collection_name}' created.")
        except Exception as e:
            logger.warning(f"Failed to check/create Qdrant collection: {e}")

    def add_memory(self, memory_id: str, text: str, metadata: Dict[str, Any]):
        if not self.client:
            return
        try:
            # Fake simple vector embedding for demonstration fallback
            fake_vector = [0.1] * 384
            self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    models.PointStruct(
                        id=hash(memory_id) % (2**31),
                        vector=fake_vector,
                        payload={"text": text, **metadata}
                    )
                ]
            )
        except Exception as e:
            logger.error(f"Error saving to Qdrant: {e}")

    def search_memories(self, query_text: str, limit: int = 5) -> List[Dict[str, Any]]:
        if not self.client:
            return []
        try:
            fake_vector = [0.1] * 384
            results = self.client.search(
                collection_name=self.collection_name,
                query_vector=fake_vector,
                limit=limit
            )
            return [hit.payload for hit in results]
        except Exception as e:
            logger.error(f"Error searching Qdrant: {e}")
            return []

vector_store = VectorMemoryStore()
