"""
Graph Explorer Python Helper

This module provides helper functions to visualize graph data from Python
notebooks directly in the Graph Explorer web application.
"""

import json
import urllib.parse
import webbrowser
from typing import Optional, Union, Dict, Any, List
import pandas as pd
import numpy as np

def visualize_graph(df: pd.DataFrame, 
                    source_col: Optional[str] = None, 
                    target_col: Optional[str] = None, 
                    edge_type_col: Optional[str] = None,
                    app_url: str = "http://localhost:3000",
                    method: str = "url",
                    jupyter_display: bool = True) -> str:
    """
    Visualize a pandas DataFrame as a network graph in the Graph Explorer application.
    
    This function allows you to visualize relationship data from your pandas DataFrame
    directly in the Graph Explorer web application. It supports two methods:
    
    1. URL method: Embeds data in a URL and opens it in a browser
    2. JavaScript method: Uses JavaScript to send data to an already open app instance
       (only works in Jupyter notebooks)
    
    Parameters:
    -----------
    df : pandas.DataFrame
        DataFrame containing the relationship data
    
    source_col : str, optional
        Column name for source nodes. If not provided, the first column will be used.
    
    target_col : str, optional
        Column name for target nodes. If not provided, the third column will be used.
    
    edge_type_col : str, optional
        Column name for relationship types. If not provided, the second column will be used.
    
    app_url : str, default="http://localhost:3000"
        URL where the Graph Explorer application is running
    
    method : str, default="url"
        Method to use for passing data to the application:
        - "url": Encode data in URL and open in browser
        - "js": Use JavaScript to send data to open app (Jupyter only)
    
    jupyter_display : bool, default=True
        Whether to display a JavaScript widget in Jupyter notebooks
        (only applicable when method="js")
    
    Returns:
    --------
    str
        URL that can be used to view the visualization
    
    Examples:
    ---------
    >>> import pandas as pd
    >>> from graph_explorer import visualize_graph
    >>> 
    >>> # Create or load your relationship data
    >>> df = pd.DataFrame({
    >>>     "source": ["Alice", "Bob", "Charlie"],
    >>>     "relationship": ["friends", "colleagues", "family"],
    >>>     "target": ["Bob", "Charlie", "Alice"]
    >>> })
    >>> 
    >>> # Visualize with default column detection
    >>> visualize_graph(df)
    >>> 
    >>> # Or specify column names explicitly
    >>> visualize_graph(df, source_col="source", target_col="target", edge_type_col="relationship")
    """
    # Make a copy to avoid modifying the original
    data_df = df.copy()
    
    # Handle NaN values by converting to None
    data_df = data_df.replace({np.nan: None})
    
    # Convert DataFrame to JSON-compatible format
    # Use pandas' to_dict method for records orientation
    # This creates a list of dictionaries, one per row
    records = data_df.to_dict(orient='records')
    
    # Serialize to JSON string
    json_data = json.dumps(records)
    
    # Generate the URL with encoded data
    encoded_data = urllib.parse.quote(json_data)
    url = f"{app_url}/?data={encoded_data}"
    
    # If URL is too long (>2000 chars), warn the user
    if len(url) > 2000:
        print(f"Warning: URL length is {len(url)} characters, which may exceed browser limits.")
        print("Consider using method='js' or reducing the size of your dataset.")
    
    # For JavaScript method (useful in Jupyter)
    if method == "js" and jupyter_display:
        try:
            from IPython.display import display, HTML
            
            js_code = f"""
            <script>
              var graphData = {json_data};
              var graphWindow = window.open('{app_url}', '_blank');
              
              // Wait for the window to load, then send data
              if (graphWindow) {{
                graphWindow.onload = function() {{
                  graphWindow.loadGraphData(graphData);
                }};
                
                // Fallback if onload doesn't trigger
                setTimeout(function() {{
                  try {{
                    graphWindow.loadGraphData(graphData);
                  }} catch(e) {{
                    console.error('Failed to send data to graph window', e);
                  }}
                }}, 1000);
              }}
            </script>
            """
            
            display(HTML(js_code))
            print(f"Sending data to Graph Explorer ({len(records)} records)")
            
        except ImportError:
            print("IPython display module not available. Falling back to URL method.")
            webbrowser.open(url)
    else:
        # URL method - open in browser
        webbrowser.open(url)
    
    return url

def process_parquet_for_graph(
    df: pd.DataFrame,
    source_col: str,
    target_col: str,
    edge_type_col: Optional[str] = None,
    edge_type_default: str = "connection",
    filters: Optional[Dict[str, Any]] = None,
    max_records: int = 1000
) -> pd.DataFrame:
    """
    Process a Parquet DataFrame into a format suitable for graph visualization.
    
    This helper function extracts relationship data from a potentially large
    DataFrame, applies filters, and formats it for the Graph Explorer application.
    
    Parameters:
    -----------
    df : pandas.DataFrame
        The DataFrame containing the data, typically loaded from a Parquet file
    
    source_col : str
        Column name for source nodes
    
    target_col : str
        Column name for target nodes
    
    edge_type_col : str, optional
        Column name for relationship types. If not provided, all relationships
        will use the edge_type_default value.
    
    edge_type_default : str, default="connection"
        Default relationship type to use if edge_type_col is not provided
    
    filters : dict, optional
        Dictionary of column:value pairs to filter the DataFrame
        Example: {"category": "finance", "weight": {"operator": ">", "value": 0.5}}
    
    max_records : int, default=1000
        Maximum number of records to include in the visualization.
        Useful to prevent browser performance issues with large datasets.
    
    Returns:
    --------
    pandas.DataFrame
        A DataFrame formatted for graph visualization, containing only the
        columns needed for the visualization.
    
    Examples:
    ---------
    >>> import pandas as pd
    >>> from graph_explorer import process_parquet_for_graph, visualize_graph
    >>> 
    >>> # Load your large Parquet data
    >>> df = pd.read_parquet("large_dataset.parquet")
    >>> 
    >>> # Process and extract a subset for visualization
    >>> graph_data = process_parquet_for_graph(
    >>>     df,
    >>>     source_col="user_id",
    >>>     target_col="friend_id",
    >>>     edge_type_col="relationship_type",
    >>>     filters={"active": True, "connection_strength": {"operator": ">", "value": 0.7}},
    >>>     max_records=500
    >>> )
    >>> 
    >>> # Visualize the processed data
    >>> visualize_graph(graph_data)
    """
    # Make a copy to avoid modifying the original
    result_df = df.copy()
    
    # Apply filters if provided
    if filters:
        for col, condition in filters.items():
            if isinstance(condition, dict) and "operator" in condition:
                # Handle operators like >, <, >=, etc.
                op = condition["operator"]
                val = condition["value"]
                
                if op == ">":
                    result_df = result_df[result_df[col] > val]
                elif op == ">=":
                    result_df = result_df[result_df[col] >= val]
                elif op == "<":
                    result_df = result_df[result_df[col] < val]
                elif op == "<=":
                    result_df = result_df[result_df[col] <= val]
                elif op == "!=":
                    result_df = result_df[result_df[col] != val]
                elif op == "in":
                    result_df = result_df[result_df[col].isin(val)]
                elif op == "not in":
                    result_df = result_df[~result_df[col].isin(val)]
                else:
                    raise ValueError(f"Unsupported operator: {op}")
            else:
                # Simple equality filter
                result_df = result_df[result_df[col] == condition]
    
    # Extract only the columns we need
    needed_cols = [source_col, target_col]
    if edge_type_col:
        needed_cols.append(edge_type_col)
    
    result_df = result_df[needed_cols]
    
    # Limit to max_records
    if len(result_df) > max_records:
        print(f"Warning: Dataset truncated from {len(result_df)} to {max_records} records.")
        result_df = result_df.head(max_records)
    
    # If no edge_type_col was provided, add a default one
    if not edge_type_col:
        result_df["relationship_type"] = edge_type_default
        edge_type_col = "relationship_type"
    
    # Standardize column names to match expected format
    result_df = result_df.rename(columns={
        source_col: "Source",
        target_col: "Target",
        edge_type_col: "RelationshipType"
    })
    
    return result_df

# Example usage in a notebook
if __name__ == "__main__":
    # This code only runs when the module is executed directly
    # It serves as an example of how to use the functions
    
    # Create sample data
    sample_data = pd.DataFrame({
        "person1": ["Alice", "Bob", "Charlie", "Diana"],
        "connection": ["friend", "colleague", "family", "classmate"],
        "person2": ["Bob", "Charlie", "Diana", "Alice"]
    })
    
    # Visualize with default settings
    visualize_graph(sample_data)