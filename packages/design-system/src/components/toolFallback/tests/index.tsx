/**
 * External depencenies
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'
/**
 * Internal dependencies
 */
import { ToolFallback } from '..';

// Mock data
const mockArgs = { query: 'react testing library' };
const mockResult = { count: 5, items: ['Item 1', 'Item 2'] };

describe('ClaudeToolCard Component', () => {
  
  it('renders the tool name and execution status correctly', () => {
    render(
      <ToolFallback
        addResult={(result) => undefined}
        resume={()=> undefined}      
        type='tool-call'
        toolCallId='google_search'
        args={mockArgs}
        toolName="google_search" 
        argsText={mockArgs.query} 
        status={{type: "complete" }}
      />
    );

    expect(screen.queryByText('google_search')).toBeInTheDocument();
    expect(screen.queryByText('Executed')).toBeInTheDocument();
  });

  it('starts collapsed when status is "success" or "error"', () => {
    render(
      <ToolFallback
        addResult={(result) => undefined}
        resume={()=> undefined} 
        type='tool-call'
        toolCallId="long_running_process"
        args={mockArgs}
        toolName="quick_task"
        argsText={mockArgs.query} 
        status={{type: "complete" }}
        result="Done"
      />
    );

    // Arguments should NOT be visible initially
    expect(screen.queryByText(mockArgs.query)).not.toBeInTheDocument();
  });

  it('toggles visibility when header is clicked', () => {
    render(
      <ToolFallback
        addResult={(result) => undefined}
        resume={()=> undefined}
        type='tool-call'
        toolCallId="long_running_process"
        args={mockArgs}
        toolName="toggle_test" 
        argsText={mockArgs.query} 
        status={{type: "complete" }} 
      />
    );

    const header = screen.getByText('toggle_test').closest('div')?.parentElement?.parentElement;
    
    // 1. Click to expand
    fireEvent.click(header!);
    expect(screen.getByText(`"${mockArgs.query}"`)).toBeInTheDocument();

    // 2. Click to collapse
    fireEvent.click(header!);
    // Wait for transition or check immediate removal (depends on implementation)
    // Note: If using CSS transitions, checking presence might need waitFor, 
    // but standard React conditional rendering removes it from DOM immediately.
    expect(screen.queryByText(`"${mockArgs.query}"`)).not.toBeInTheDocument();
  });
});