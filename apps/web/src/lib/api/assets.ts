import { apiFetch } from './client';
import type { Asset, CreateAssetRequest } from '@/types/api';

interface PaginatedAssetsResponse {
  data: Asset[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function listAssets(): Promise<Asset[]> {
  const response = await apiFetch<PaginatedAssetsResponse>('/assets');
  return response.data;
}

export async function getAsset(id: string): Promise<Asset> {
  return apiFetch<Asset>(`/assets/${id}`);
}

export async function createAsset(data: CreateAssetRequest): Promise<Asset> {
  return apiFetch<Asset>('/assets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteAsset(id: string): Promise<void> {
  return apiFetch<void>(`/assets/${id}`, { method: 'DELETE' });
}
