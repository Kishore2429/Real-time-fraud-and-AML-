import axios, { AxiosError } from 'axios';
import type {
  HealthResponse,
  DashboardResponse,
  TransactionsResponse,
  AMLResponse,
  AccountRelationshipsResponse,
  CasesResponse,
  EvaluationResponse,
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('[SYNESIS API Error]', error.message, error.response?.status);
    return Promise.reject(error);
  }
);

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  status: 'ok' | 'error' | 'loading';
}

async function fetchWithResult<T>(endpoint: string): Promise<ApiResult<T>> {
  try {
    const response = await apiClient.get<T>(endpoint);
    return { data: response.data, error: null, status: 'ok' };
  } catch (err) {
    const axiosErr = err as AxiosError;
    let message = 'Unknown error';
    if (axiosErr.code === 'ECONNREFUSED' || axiosErr.code === 'ERR_NETWORK') {
      message = 'Backend unreachable. Ensure FastAPI is running at ' + BASE_URL;
    } else if (axiosErr.response) {
      message = `Server error ${axiosErr.response.status}: ${axiosErr.response.statusText}`;
    } else {
      message = axiosErr.message;
    }
    return { data: null, error: message, status: 'error' };
  }
}

export const api = {
  health: () => fetchWithResult<HealthResponse>('/api/health'),
  dashboard: () => fetchWithResult<DashboardResponse>('/api/dashboard'),
  transactions: () => fetchWithResult<TransactionsResponse | unknown>('/api/transactions'),
  amlPatterns: () => fetchWithResult<AMLResponse | unknown>('/api/aml/patterns'),
  accountRelationships: () => fetchWithResult<AccountRelationshipsResponse | unknown>('/api/accounts/relationships'),
  cases: () => fetchWithResult<CasesResponse | unknown>('/api/cases'),
  evaluation: () => fetchWithResult<EvaluationResponse>('/api/evaluation'),
};

export { BASE_URL };
export default api;
