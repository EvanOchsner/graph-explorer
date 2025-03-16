import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import Papa from 'papaparse';
import './GraphVisualization.css';

const GraphVisualization = () => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [sourceColumn, setSourceColumn] = useState('');
  const [targetColumn, setTargetColumn] = useState('');
  const [edgeTypeColumn, setEdgeTypeColumn] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [highlightedType, setHighlightedType] = useState(null);
  
  const svgRef = useRef();
  const tooltipRef = useRef();
  
  // Handle file upload
  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    setLoading(true);
    setError(null);
    
    try {
      // Currently, we only fully support CSV files in the browser
      if (!uploadedFile.name.toLowerCase().endsWith('.csv')) {
        setError("Currently only CSV files are supported. Please convert your data to CSV format.");
        setLoading(false);
        return;
      }
      
      // Handle CSV files
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          Papa.parse(e.target.result, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.data && results.data.length > 0) {
                setData(results.data);
                setColumns(results.meta.fields || []);
                setLoading(false);
              } else {
                throw new Error("No data found in file");
              }
            },
            error: (error) => {
              throw new Error(`Parsing error: ${error}`);
            }
          });
        } catch (err) {
          setError(`Failed to parse CSV file: ${err.message}`);
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError("Failed to read file");
        setLoading(false);
      };
      
      reader.readAsText(uploadedFile);
    } catch (err) {
      setError(`Error processing file: ${err.message}`);
      setLoading(false);
    }
  };
  
  // Load sample dataset
  const loadSampleData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/src/data/classmates.csv');
      const csvText = await response.text();
      
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            setData(results.data);
            setColumns(results.meta.fields || []);
            // Auto-select columns for sample data
            setSourceColumn('Source');
            setTargetColumn('Target');
            setEdgeTypeColumn('RelationshipType');
            setLoading(false);
          } else {
            throw new Error("No data found in sample file");
          }
        },
        error: (error) => {
          throw new Error(`Parsing error: ${error}`);
        }
      });
    } catch (err) {
      setError(`Error loading sample data: ${err.message}`);
      setLoading(false);
    }
  };
  
  // Process data into graph format when columns are selected
  useEffect(() => {
    if (!data || !sourceColumn || !targetColumn) return;
    
    try {
      // Create nodes and links from the data
      const nodeMap = new Map();
      const links = [];
      
      // Process each row
      data.forEach(row => {
        // Get values from the specified columns, handling null/undefined gracefully
        const source = row[sourceColumn] ? String(row[sourceColumn]) : "";
        const target = row[targetColumn] ? String(row[targetColumn]) : "";
        
        // Get edge type, using default if not specified
        const edgeType = edgeTypeColumn && row[edgeTypeColumn] 
          ? String(row[edgeTypeColumn]) 
          : 'default';
        
        // Skip rows with missing source or target
        if (!source || !target) return;
        
        // Add source node if not exists
        if (!nodeMap.has(source)) {
          nodeMap.set(source, { id: source, group: source.charCodeAt(0) % 5 + 1 });
        }
        
        // Add target node if not exists
        if (!nodeMap.has(target)) {
          nodeMap.set(target, { id: target, group: target.charCodeAt(0) % 5 + 1 });
        }
        
        // Add link
        links.push({
          source,
          target,
          type: edgeType,
          value: 1
        });
      });
      
      // Convert nodeMap to array
      const nodes = Array.from(nodeMap.values());
      
      setGraphData({ nodes, links });
    } catch (err) {
      setError(`Error creating graph: ${err.message}`);
    }
  }, [data, sourceColumn, targetColumn, edgeTypeColumn]);
  
  // Render the graph
  useEffect(() => {
    if (!graphData || !svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const container = svg.node().parentElement;
    const width = container.clientWidth;
    const height = 700;
    
    // Clear previous graph
    svg.selectAll("*").remove();
    
    // Create tooltip div if it doesn't exist
    let tooltip = d3.select(tooltipRef.current);
    
    // Get all unique relationship types
    const relationshipTypes = [...new Set(graphData.links.map(d => d.type))];
    
    // Map relationship types to colors
    const relationshipColors = {};
    const colors = [
      "#4299e1", "#48bb78", "#ed8936", "#667eea", "#f56565", 
      "#9f7aea", "#38b2ac", "#f6ad55", "#fc8181", "#b794f4",
      "#63b3ed", "#68d391", "#f6e05e", "#4fd1c5", "#fbd38d"
    ];
    
    relationshipTypes.forEach((type, index) => {
      relationshipColors[type] = colors[index % colors.length];
    });
    
    // Create a force simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links)
        .id(d => d.id)
        .distance(100))
      .force("charge", d3.forceManyBody()
        .strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1))
      .force("collision", d3.forceCollide().radius(20));
    
    // Add zoom functionality
    const zoom = d3.zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);
    
    // Create a main group for all elements
    const g = svg.append("g");
    
    // Create links
    const link = g.append("g")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke", d => relationshipColors[d.type] || "#999")
      .attr("stroke-width", 2)
      .attr("class", d => `link-${d.type}`);
      
    // Create nodes
    const node = g.append("g")
      .selectAll("g")
      .data(graphData.nodes)
      .join("g")
      .attr("class", "node-group")
      .call(drag(simulation));
    
    // Add circles for nodes
    node.append("circle")
      .attr("r", 10)
      .attr("fill", d => {
        // Different color for each letter group
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        return colorScale(d.group);
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);
    
    // Add text labels
    node.append("text")
      .attr("x", 12)
      .attr("y", 3)
      .text(d => d.id)
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("fill", "#333");
    
    // Set up link tooltips
    link.on("mouseover", function(event, d) {
      d3.select(this)
        .attr("stroke-width", 4)
        .attr("stroke-opacity", 1);
        
      tooltip
        .style("opacity", 1)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px")
        .html(`<strong>${d.source.id} → ${d.target.id}</strong><br>${d.type.replace("_", " ")}`);
    })
    .on("mouseout", function() {
      d3.select(this)
        .attr("stroke-width", 2)
        .attr("stroke-opacity", 0.6);
        
      tooltip.style("opacity", 0);
    });
    
    // Set up node tooltips and interactions
    node.on("mouseover", function(event, d) {
      // Highlight the node
      d3.select(this).select("circle")
        .attr("r", 15)
        .attr("stroke", "#333");
      
      // Show tooltip with connections
      const connections = graphData.links.filter(link => 
        link.source.id === d.id || link.target.id === d.id
      );
      
      const connectionsList = connections.map(conn => {
        const otherPerson = conn.source.id === d.id ? conn.target.id : conn.source.id;
        const relationshipType = conn.type.replace("_", " ");
        return `<li><strong>${otherPerson}</strong>: ${relationshipType}</li>`;
      }).join("");
      
      tooltip
        .style("opacity", 1)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px")
        .html(`
          <strong>${d.id}</strong>
          <p>Connections (${connections.length}):</p>
          <ul style="padding-left: 20px; margin-top: 5px; margin-bottom: 5px;">
            ${connectionsList}
          </ul>
        `);
        
      // Highlight connected links
      link.each(function(l) {
        if (l.source.id === d.id || l.target.id === d.id) {
          d3.select(this)
            .attr("stroke-width", 3)
            .attr("stroke-opacity", 1);
        } else {
          d3.select(this)
            .attr("stroke-opacity", 0.1);
        }
      });
      
      // Highlight connected nodes
      node.each(function(n) {
        const isConnected = connections.some(conn => 
          (conn.source.id === d.id && conn.target.id === n.id) || 
          (conn.target.id === d.id && conn.source.id === n.id)
        );
        
        if (n.id !== d.id && !isConnected) {
          d3.select(this).style("opacity", 0.2);
        }
      });
    })
    .on("mouseout", function() {
      // Reset node highlight
      d3.select(this).select("circle")
        .attr("r", 10)
        .attr("stroke", "#fff");
      
      // Hide tooltip
      tooltip.style("opacity", 0);
      
      // Reset all links and nodes if no relationship type is highlighted
      if (!highlightedType) {
        link
          .attr("stroke-width", 2)
          .attr("stroke-opacity", 0.6);
        
        node.style("opacity", 1);
      } else {
        // Otherwise reapply the relationship type filter
        applyRelationshipFilter(highlightedType);
      }
    });
    
    // Create legend for relationship types
    const legendData = Object.entries(relationshipColors)
      .map(([type, color]) => ({ type: type.replace("_", " "), color }));
    
    const legendWidth = 200;
    const legendItemHeight = 20;
    const legendMargin = { top: 20, right: 20, bottom: 20, left: 20 };
    
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - legendWidth - legendMargin.right}, ${legendMargin.top})`);
    
    // Semi-transparent background for legend
    legend.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendItemHeight * legendData.length + legendMargin.top + legendMargin.bottom)
      .attr("fill", "white")
      .attr("fill-opacity", 0.7)
      .attr("stroke", "#ddd")
      .attr("rx", 5);
    
    // Title
    legend.append("text")
      .attr("x", 10)
      .attr("y", 15)
      .text("Relationship Types")
      .attr("font-weight", "bold")
      .attr("font-size", 12);
    
    // Legend items
    const legendItems = legend.selectAll(".legend-item")
      .data(legendData)
      .join("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(10, ${i * legendItemHeight + legendMargin.top + 10})`)
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        const type = d.type.replace(" ", "_");
        // Toggle highlight
        if (highlightedType === type) {
          setHighlightedType(null);
          applyRelationshipFilter(null);
        } else {
          setHighlightedType(type);
          applyRelationshipFilter(type);
        }
      });
    
    legendItems.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("y", 2)
      .attr("fill", d => d.color);
    
    legendItems.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(d => d.type)
      .attr("font-size", 10);
    
    // Update positions on simulation tick
    simulation.on("tick", () => {
      // Keep nodes within bounds
      graphData.nodes.forEach(d => {
        d.x = Math.max(20, Math.min(width - 20, d.x));
        d.y = Math.max(20, Math.min(height - 20, d.y));
      });
      
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
      
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });
    
    // Helper function to apply relationship type filter
    function applyRelationshipFilter(type) {
      if (!type) {
        // Reset all
        link
          .attr("stroke-width", 2)
          .attr("stroke-opacity", 0.6);
        
        node.style("opacity", 1);
        return;
      }
      
      // Dim all links and highlight only the selected type
      link.each(function(d) {
        if (d.type === type) {
          d3.select(this)
            .attr("stroke-width", 3)
            .attr("stroke-opacity", 1);
        } else {
          d3.select(this)
            .attr("stroke-width", 1)
            .attr("stroke-opacity", 0.1);
        }
      });
      
      // Dim nodes not connected by this relationship type
      const relevantNodes = new Set();
      graphData.links.forEach(d => {
        if (d.type === type) {
          relevantNodes.add(d.source.id);
          relevantNodes.add(d.target.id);
        }
      });
      
      node.each(function(d) {
        if (relevantNodes.has(d.id)) {
          d3.select(this).style("opacity", 1);
        } else {
          d3.select(this).style("opacity", 0.2);
        }
      });
    }
    
    // Drag functions
    function drag(simulation) {
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      
      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }
      
      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
    
    // Release memory when component unmounts
    return () => {
      simulation.stop();
    };
  }, [graphData, highlightedType]);
  
  return (
    <div className="graph-visualization-container">
      <div className="controls-panel">
        <h2>Data Input</h2>
        <div className="file-upload">
          <label htmlFor="file-upload">Upload Relationship Data:</label>
          <input
            id="file-upload"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="file-input"
          />
          <div className="file-format-info">
            Supported formats: CSV
          </div>
        </div>
        
        <button onClick={loadSampleData} className="sample-data-btn">
          Load Sample Data
        </button>
        
        {loading && <div className="loading">Loading data...</div>}
        {error && <div className="error">{error}</div>}
        
        {columns.length > 0 && (
          <div className="column-selection">
            <h3>Column Mapping</h3>
            <p className="mapping-instruction">
              Select which columns contain graph relationship data:
            </p>
            
            <div className="select-group">
              <label htmlFor="source-column">Source Node Column: <span className="required">*</span></label>
              <select
                id="source-column"
                value={sourceColumn}
                onChange={(e) => setSourceColumn(e.target.value)}
                className="column-select"
                required
              >
                <option value="">Select Source Column</option>
                {columns.map(col => (
                  <option key={`source-${col}`} value={col}>{col}</option>
                ))}
              </select>
            </div>
            
            <div className="select-group">
              <label htmlFor="target-column">Target Node Column: <span className="required">*</span></label>
              <select
                id="target-column"
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="column-select"
                required
              >
                <option value="">Select Target Column</option>
                {columns.map(col => (
                  <option key={`target-${col}`} value={col}>{col}</option>
                ))}
              </select>
            </div>
            
            <div className="select-group">
              <label htmlFor="edge-type-column">Edge Type Column:</label>
              <select
                id="edge-type-column"
                value={edgeTypeColumn}
                onChange={(e) => setEdgeTypeColumn(e.target.value)}
                className="column-select"
              >
                <option value="">None (use default edge type)</option>
                {columns.map(col => (
                  <option key={`edge-${col}`} value={col}>{col}</option>
                ))}
              </select>
              <div className="field-description">
                Specifies the relationship type between nodes
              </div>
            </div>
            
            <div className="column-info">
              <p>Your file has {columns.length} columns: {columns.join(', ')}</p>
              <p>Any columns not selected above will be ignored.</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="graph-container">
        <h2>Relationship Graph</h2>
        {!graphData && !loading && (
          <div className="empty-state">
            <p>Upload a data file or load the sample data to visualize relationships.</p>
          </div>
        )}
        
        <div className="svg-container">
          <svg 
            ref={svgRef} 
            className="graph-svg"
            width="100%"
            height="700"
          />
          <div 
            ref={tooltipRef}
            className="tooltip"
          />
        </div>
        
        {graphData && (
          <div className="graph-stats">
            <p>
              {graphData.nodes.length} nodes, {graphData.links.length} relationships
            </p>
            <p className="tip">
              <strong>Tip:</strong> Drag nodes to rearrange. Click relationship types in the legend to filter.
              Use mouse wheel to zoom, click and drag to pan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphVisualization;
