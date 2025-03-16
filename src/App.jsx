import React from 'react';
import './App.css';
import GraphVisualization from './components/GraphVisualization';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Relationship Graph Visualizer</h1>
        <p>Visualize network relationships from Parquet/CSV files</p>
      </header>
      <main className="App-main">
        <GraphVisualization />
      </main>
      <footer className="App-footer">
        <p>
          Created with React, D3.js and Apache Arrow
        </p>
      </footer>
    </div>
  );
}

export default App;
