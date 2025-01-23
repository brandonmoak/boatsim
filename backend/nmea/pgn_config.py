import yaml
from pathlib import Path
from typing import Dict, Any

PGN_PATH = Path(__file__).parent.parent.parent / 'frontend' / 'src' / 'config' / 'pgn_config.yaml'

# Singleton storage for config and mapping
_config = None
_id_to_name_mapping = None

def _load_pgn_config() -> Dict[str, Any]:
    with open(PGN_PATH, 'r') as f:
        return yaml.safe_load(f)['pgns']

def _create_id_to_name_mapping(config: Dict[str, Any]) -> Dict[str, str]:
    return {params['pgn']: pgn_name for pgn_name, params in config.items()}

# Load config and mapping at module import
_config = _load_pgn_config()
_id_to_name_mapping = _create_id_to_name_mapping(_config)

def get_pgn_config() -> Dict[str, Any]:
    return _config

def get_id_to_name_mapping() -> Dict[str, str]:
    return _id_to_name_mapping 