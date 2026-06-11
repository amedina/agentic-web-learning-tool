export interface AlgoliaHit {
  objectID: string;
  name: string;
  version?: string;
  description?: string;
  modified?: string | number;
  homepage?: string;
  repository?: { url: string };
  owners?: Array<{ name: string; avatar?: string }>;
  owner?: { name: string; avatar?: string };
  downloadsLast30Days?: number;
  popular?: boolean;
  keywords?: string[];
  deprecated?: boolean;
  isDeprecated?: boolean;
  license?: string;
  dependents?: number;
}

export interface SearchFilters {
  minDownloads: number | null;
  lastUpdated: number | null;
  notDeprecated: boolean;
  hasTypes: boolean;
  moduleEsm: boolean;
  licenseMit: boolean;
  hasHomepage: boolean;
  hasRepo: boolean;
  ranking: string;
}
