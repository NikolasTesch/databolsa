import { apiFetch } from './client';
import type {
  Transaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
} from '@/types/api';

export async function listTransactions(assetId: string): Promise<Transaction[]> {
  return apiFetch<Transaction[]>(`/assets/${assetId}/transactions`);
}

export async function createTransaction(
  assetId: string,
  data: CreateTransactionRequest,
): Promise<Transaction> {
  return apiFetch<Transaction>(`/assets/${assetId}/transactions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTransaction(
  id: string,
  data: UpdateTransactionRequest,
): Promise<Transaction> {
  return apiFetch<Transaction>(`/transactions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTransaction(id: string): Promise<void> {
  return apiFetch<void>(`/transactions/${id}`, { method: 'DELETE' });
}
