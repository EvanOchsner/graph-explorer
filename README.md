# Relationship Graph Visualizer

An interactive visualization tool for network relationships from Parquet/CSV files.

## Features

- Load relationship data from Parquet/CSV files
- Specify source, destination, and relationship type columns
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

1. Upload your relationship data file (CSV or Parquet format)
2. Select the relevant columns:
   - Source column (entities that initiate relationships)
   - Target column (entities that receive relationships)
   - Relationship Type column (optional)
3. Interact with the graph:
   - Drag nodes to rearrange
   - Hover over nodes to see all connections
   - Click relationship types in the legend to filter
   - Zoom and pan for larger graphs

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
- Apache Arrow (via Parquet-Wasm) for Parquet file processing
- PapaParse for CSV processing

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- D3.js community for the force-directed graph examples
- React documentation and community
