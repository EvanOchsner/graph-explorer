# Graph Explorer Python Integration

This directory contains tools for integrating the Graph Explorer visualization app with Python notebooks and Parquet data workflows.

## Overview

The Python integration allows you to:

1. Load relationship data directly from Pandas DataFrames into the Graph Explorer
2. Process and filter Parquet data for visualization
3. Seamlessly visualize graph subsets during exploratory data analysis
4. No need to export CSV files between analysis and visualization

## Requirements

- Python 3.6+
- pandas
- numpy
- A running instance of the Graph Explorer app (typically at http://localhost:3000)

## Installation

1. Make sure the Graph Explorer app is running
2. Add this directory to your Python path or copy `graph_explorer.py` to your working directory

```python
# Option 1: Add to Python path
import sys
sys.path.append('/path/to/graph-explorer/python')

# Option 2: Copy the file to your working directory
# cp /path/to/graph-explorer/python/graph_explorer.py .
```

## Quick Start

```python
import pandas as pd
from graph_explorer import visualize_graph, process_parquet_for_graph

# Load your parquet data
df = pd.read_parquet('your_data.parquet')

# Process a subset for visualization
graph_data = process_parquet_for_graph(
    df,
    source_col='entity1',
    target_col='entity2', 
    edge_type_col='relationship_type',
    filters={'active': True}
)

# Visualize in the Graph Explorer app
visualize_graph(graph_data)
```

## Example Notebook

Check out `example_notebook.ipynb` for a detailed example of using these tools with Parquet data.

## Functions

### `visualize_graph()`

Send a DataFrame directly to the Graph Explorer visualization app.

```python
visualize_graph(
    df,                       # pandas DataFrame with relationship data
    source_col=None,          # column for source nodes (default: first column)
    target_col=None,          # column for target nodes (default: third column)
    edge_type_col=None,       # column for relationship types (default: second column)
    app_url="http://localhost:3000",  # URL of the Graph Explorer app
    method="url",             # "url" or "js" (JavaScript for Jupyter)
    jupyter_display=True      # Whether to use IPython display (for "js" method)
)
```

### `process_parquet_for_graph()`

Process, filter, and format a DataFrame for graph visualization.

```python
process_parquet_for_graph(
    df,                       # pandas DataFrame with relationship data
    source_col,               # column for source nodes
    target_col,               # column for target nodes
    edge_type_col=None,       # column for relationship types (optional)
    edge_type_default="connection",  # default type if edge_type_col not provided
    filters=None,             # dict of filters to apply
    max_records=1000          # limit to prevent browser performance issues
)
```

## Tips for Working with Large Parquet Files

1. Use column pruning when loading Parquet files:
   ```python
   df = pd.read_parquet('large_file.parquet', columns=['source', 'target', 'type'])
   ```

2. Apply filters at Parquet read time when possible:
   ```python
   import pyarrow.dataset as ds
   dataset = ds.dataset('large_file.parquet')
   df = dataset.to_table(filter=ds.field('date') == '2023-01-01').to_pandas()
   ```

3. Limit the number of records sent to the visualization:
   ```python
   graph_data = process_parquet_for_graph(df, ..., max_records=500)
   ```

4. For very large graphs, consider using community detection or other techniques to extract meaningful subgraphs before visualization.