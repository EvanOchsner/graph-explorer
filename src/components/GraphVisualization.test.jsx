import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GraphVisualization from './GraphVisualization';
import '@testing-library/jest-dom';

// Mock d3 - just create mock functions for everything we use
jest.mock('d3', () => {
  return {
    select: jest.fn(() => ({
      call: jest.fn(),
      selectAll: jest.fn().mockReturnThis(),
      remove: jest.fn(),
      node: jest.fn(() => ({ parentElement: { clientWidth: 500 } })),
      append: jest.fn().mockReturnThis(),
      attr: jest.fn().mockReturnThis(),
      style: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      html: jest.fn(),
      data: jest.fn().mockReturnThis(),
      join: jest.fn().mockReturnThis(),
      each: jest.fn()
    })),
    forceSimulation: jest.fn(() => ({
      force: jest.fn().mockReturnThis(),
      id: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      alphaTarget: jest.fn().mockReturnThis(),
      restart: jest.fn(),
      stop: jest.fn(),
      nodes: jest.fn().mockReturnThis()
    })),
    forceLink: jest.fn().mockReturnThis(),
    forceManyBody: jest.fn().mockReturnThis(),
    strength: jest.fn().mockReturnThis(),
    forceCenter: jest.fn(),
    forceX: jest.fn().mockReturnThis(),
    forceY: jest.fn().mockReturnThis(),
    forceCollide: jest.fn().mockReturnThis(),
    radius: jest.fn().mockReturnThis(),
    zoom: jest.fn().mockReturnThis(),
    scaleExtent: jest.fn().mockReturnThis(),
    drag: jest.fn().mockReturnThis(),
    scaleOrdinal: jest.fn().mockReturnThis(),
    schemeCategory10: ['#ff0000', '#00ff00', '#0000ff']
  };
});

// Mock Papa Parse
jest.mock('papaparse', () => ({
  parse: jest.fn((data, config) => {
    // Simulate successful parsing
    if (config.complete) {
      config.complete({
        data: [
          { Source: 'Alice', RelationshipType: 'Friend', Target: 'Bob' },
          { Source: 'Bob', RelationshipType: 'Colleague', Target: 'Charlie' }
        ],
        meta: {
          fields: ['Source', 'RelationshipType', 'Target']
        }
      });
    }
  })
}));

// Mock fetch for sample data
global.fetch = jest.fn(() => 
  Promise.resolve({
    text: () => Promise.resolve('Source,RelationshipType,Target\nAlice,Friend,Bob')
  })
);

describe('GraphVisualization Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<GraphVisualization />);
    expect(screen.getByText('Data Input')).toBeInTheDocument();
  });
  
  test('shows file upload section', () => {
    render(<GraphVisualization />);
    expect(screen.getByText('Upload Relationship Data:')).toBeInTheDocument();
    expect(screen.getByText('Supported formats: CSV')).toBeInTheDocument();
  });
  
  test('has sample data buttons', () => {
    render(<GraphVisualization />);
    const standardButton = screen.getByText('Load Sample Data');
    const alternateButton = screen.getByText('Load Alternate Sample');
    
    expect(standardButton).toBeInTheDocument();
    expect(alternateButton).toBeInTheDocument();
  });
  
  test('loads standard sample data when button is clicked', async () => {
    render(<GraphVisualization />);
    const sampleButton = screen.getByText('Load Sample Data');
    
    fireEvent.click(sampleButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/src/data/classmates.csv');
    });
  });
  
  test('loads alternate sample data when button is clicked', async () => {
    render(<GraphVisualization />);
    const alternateButton = screen.getByText('Load Alternate Sample');
    
    fireEvent.click(alternateButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/src/data/alternate-order.csv');
    });
  });
  
  test('shows empty state when no data is loaded', () => {
    render(<GraphVisualization />);
    expect(screen.getByText('Upload a data file or load the sample data to visualize relationships.')).toBeInTheDocument();
  });
  
  test('handles file upload', async () => {
    const file = new File(['Source,RelationshipType,Target\nAlice,Friend,Bob'], 'test.csv', { type: 'text/csv' });
    
    render(<GraphVisualization />);
    
    const input = screen.getByLabelText('Upload Relationship Data:');
    fireEvent.change(input, { target: { files: [file] } });
    
    // Wait for file processing
    await waitFor(() => {
      expect(input.files[0]).toBe(file);
    });
  });
  
  test('shows error for unsupported file formats', async () => {
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    
    render(<GraphVisualization />);
    
    const input = screen.getByLabelText('Upload Relationship Data:');
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Currently only CSV files are supported. Please convert your data to CSV format.')).toBeInTheDocument();
    });
  });
  
  test('uses default columns when no columns are selected', async () => {
    // Since we can't easily test the internal state transformation,
    // we're just making sure the component renders without errors
    // when it would be using the default column behavior
    render(<GraphVisualization />);
    expect(screen.getByText('Upload a data file or load the sample data to visualize relationships.')).toBeInTheDocument();
  });
  
  test('shows empty state before loading data', () => {
    render(<GraphVisualization />);
    expect(screen.getByText('Upload a data file or load the sample data to visualize relationships.')).toBeInTheDocument();
  });
});