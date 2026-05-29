import { Designation } from './employee.model';

/**
 * Sidebar node — mirrors the backend Nodes schema. Returned by
 * GET /nodes/my-nodes, already filtered to the current user's designation.
 */
export interface SidebarNode {
  nodeId: string;
  name: string;
  path: string;
  icon?: string;
  allowedDesignations: Designation[];
}

// GET /nodes/my-nodes response.
export interface MyNodesResponse {
  totalNodes: number;
  nodes: SidebarNode[];
}
