import logging
from typing import List, Dict, Any
from neo4j import GraphDatabase
from app.core.config import settings

logger = logging.getLogger(__name__)

class KnowledgeGraphStore:
    def __init__(self):
        try:
            self.driver = GraphDatabase.driver(
                settings.NEO4J_URI,
                auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD)
            )
        except Exception as e:
            logger.warning(f"Neo4j driver connection deferred: {e}")
            self.driver = None

    def close(self):
        if self.driver:
            self.driver.close()

    def add_user_allergy(self, username: str, allergy: str):
        if not self.driver:
            return
        query = """
        MERGE (u:User {name: $username})
        MERGE (a:Allergy {name: $allergy})
        MERGE (u)-[:HAS_ALLERGY]->(a)
        """
        try:
            with self.driver.session() as session:
                session.run(query, username=username, allergy=allergy)
        except Exception as e:
            logger.error(f"Error Neo4j add_user_allergy: {e}")

    def add_user_medication(self, username: str, med_name: str, dose: str):
        if not self.driver:
            return
        query = """
        MERGE (u:User {name: $username})
        MERGE (m:Medication {name: $med_name})
        MERGE (u)-[:TAKES {dose: $dose}]->(m)
        """
        try:
            with self.driver.session() as session:
                session.run(query, username=username, med_name=med_name, dose=dose)
        except Exception as e:
            logger.error(f"Error Neo4j add_user_medication: {e}")

    def check_medical_interactions(self, username: str) -> List[Dict[str, Any]]:
        if not self.driver:
            return []
        query = """
        MATCH (u:User {name: $username})-[:HAS_ALLERGY]->(a:Allergy)
        OPTIONAL MATCH (u)-[r:TAKES]->(m:Medication)
        RETURN a.name AS allergy, collect(m.name) AS medications
        """
        try:
            with self.driver.session() as session:
                result = session.run(query, username=username)
                return [record.data() for record in result]
        except Exception as e:
            logger.error(f"Error Neo4j check_medical_interactions: {e}")
            return []

    def add_user_fact(self, username: str, relation: str, target_node_label: str, target_name: str):
        if not self.driver:
            return
        
        # Sanitizar entradas básicas para evitar inyección cypher simple
        relation = "".join([c for c in relation if c.isalnum() or c == "_"]).upper()
        target_node_label = "".join([c for c in target_node_label if c.isalnum()]).capitalize()
        
        query = f"""
        MERGE (u:User {{name: $username}})
        MERGE (t:{target_node_label} {{name: $target_name}})
        MERGE (u)-[:{relation}]->(t)
        """
        try:
            with self.driver.session() as session:
                session.run(query, username=username, target_name=target_name)
        except Exception as e:
            logger.error(f"Error Neo4j add_user_fact: {e}")

graph_store = KnowledgeGraphStore()
