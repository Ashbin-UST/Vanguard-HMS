import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MyNodesResponse, SidebarNode } from '../models/node.model';

@Injectable({
  providedIn: 'root',
})
export class NodeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/nodes`;

  // Sidebar nodes cached after the first load so navigation doesn't refetch
  private cachedNodes: SidebarNode[] | null = null;

  // Raw fetch of the logged-in user's sidebar nodes (already filtered by designation)
  getMyNodes(): Observable<MyNodesResponse> {
    return this.http.get<MyNodesResponse>(`${this.apiUrl}/my-nodes`);
  }

  // Returns cached nodes if loaded, otherwise fetches once and caches them
  loadMyNodes(): Observable<SidebarNode[]> {
    if (this.cachedNodes) {
      return of(this.cachedNodes);
    }
    return this.getMyNodes().pipe(
      map((res) => res.data?.nodes ?? []),
      tap((nodes) => (this.cachedNodes = nodes)),
    );
  }

  // Clears the cached nodes (call on logout)
  clearCache(): void {
    this.cachedNodes = null;
  }
}
