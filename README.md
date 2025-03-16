# Relationship Graph Visualizer

An interactive visualization tool for network relationships from CSV files with Python integration for Parquet workflows.

## Features

- Load relationship data from CSV files
- Support for default column behavior (first 3 columns as source, edge, target)
- Seamless Python integration for Jupyter notebooks and Parquet workflows
- Interactive D3.js force-directed graph visualization
- Filter by relationship types
- Zoom, pan, and drag nodes for better exploration
- Hover tooltips showing detailed information

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

1. Clone this repository
```bash
git clone https://github.com/yourusername/relationship-graph-visualizer.git
cd relationship-graph-visualizer
```

2. Install dependencies
```bash
npm install
# or with yarn
yarn install
```

3. Start the development server
```bash
npm start
# or with yarn
yarn start
```

4. Open your browser to `http://localhost:3000`

## Usage

### Web Interface

1. Upload your relationship data file (CSV format)
2. Select the relevant columns:
   - Source column (entities that initiate relationships)
   - Target column (entities that receive relationships)
   - Relationship Type column (optional)
3. Alternatively, let the app use the default behavior:
   - First column as source nodes
   - Second column as edge types
   - Third column as target nodes
4. Interact with the graph:
   - Drag nodes to rearrange
   - Hover over nodes to see all connections
   - Click relationship types in the legend to filter
   - Zoom and pan for larger graphs

### Python Integration

For data scientists working with Parquet files in Python:

1. Start the Graph Explorer app
2. Use the Python helper functions to visualize your data:

```python
from graph_explorer import visualize_graph, process_parquet_for_graph

# Load and process your Parquet data
df = pd.read_parquet("your_data.parquet")
graph_data = process_parquet_for_graph(
    df,
    source_col="entity1",
    target_col="entity2",
    edge_type_col="relationship_type"
)

# Visualize directly in the browser
visualize_graph(graph_data)
```

See the [Python README](./python/README.md) for detailed instructions.

## Sample Data

The repository includes a sample dataset of 26 classmates (A-Z) with various relationship types:
- Family relationships (siblings, cousins)
- Friendship relationships (friends, best friends)
- Romantic relationships (dating, ex-dating)
- Academic relationships (study partners, project partners)
- And many more connection types

## Technologies Used

- React for the user interface
- D3.js for interactive graph visualization
- PapaParse for CSV processing
- Python integration for Parquet workflows (pandas, pyarrow)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- D3.js community for the force-directed graph examples
- React documentation and community
