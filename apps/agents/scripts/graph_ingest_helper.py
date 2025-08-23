import argparse
import json

import ijson
from itertools import islice, count

def ingest_data(entities_path, relations_path, project_id, batch_size):
    try:
        # Process entities
        with open(entities_path, 'r') as f:
            entities = ijson.items(f, 'item')
            entity_batches = [list(islice(entities, batch_size)) for _ in count(0)]
            for i, batch in enumerate(entity_batches):
                if batch:
                    # Call MCP create_entities with batch
                    print(f"Processing entity batch {i+1} with {len(batch)} items")

        # Process relations
        with open(relations_path, 'r') as f:
            relations = ijson.items(f, 'item')
            relation_batches = [list(islice(relations, batch_size)) for _ in count(0)]
            for i, batch in enumerate(relation_batches):
                if batch:
                    # Call MCP create_relations with batch
                    print(f"Processing relation batch {i+1} with {len(batch)} items")

    except Exception as e:
        print(f"Error ingesting data: {str(e)}")

def main():
    parser = argparse.ArgumentParser(description='Graph Ingest Helper')
    parser.add_argument('--entities', required=True, help='Path to entities MCP JSON file')
    parser.add_argument('--relations', required=True, help='Path to relations MCP JSON file')
    parser.add_argument('--project-id', required=True, help='Project ID for the graph')
    parser.add_argument('--batch-size', type=int, default=25, help='Batch size for ingestion')

    args = parser.parse_args()
    ingest_data(args.entities, args.relations, args.project_id, args.batch_size)
        parser.print_help()

if __name__ == "__main__":
    main()