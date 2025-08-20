import { graph } from './index';

describe('OpenCanvas Graph', () => {
  it('should be defined', () => {
    expect(graph).toBeDefined();
  });

  it('should have the correct configuration', () => {
    expect(graph.config.runName).toBe('open_canvas');
  });

  // Add more tests for graph functionality
});