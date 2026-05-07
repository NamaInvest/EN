/**
 * AI-19 — TanStack Query Hooks for ERP Data Fetching
 * Replaces manual useState+useEffect patterns with cached, stale-while-revalidate queries.
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// === Generic fetcher ===
async function fetcher<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
}

async function poster<T>(url: string, body: any): Promise<T> {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
}

// === Treasury Hooks ===
export function useCashPosition() {
    return useQuery({ queryKey: ['cash-position'], queryFn: () => fetcher('/api/treasury/cash-position'), staleTime: 30_000 });
}

export function useLiquidityForecast() {
    return useQuery({ queryKey: ['liquidity-forecast'], queryFn: () => fetcher('/api/treasury/liquidity/forecast'), staleTime: 60_000 });
}

// === AP Invoice Capture ===
export function useInvoiceCaptures(status: string = 'ALL') {
    return useQuery({ queryKey: ['invoice-captures', status], queryFn: () => fetcher(`/api/ap/capture?status=${status}`), staleTime: 10_000 });
}

// === Shop Floor ===
export function useShopFloorSessions() {
    return useQuery({ queryKey: ['shopfloor-sessions'], queryFn: () => fetcher('/api/manufacturing/shopfloor?action=active'), refetchInterval: 5_000 });
}

export function useAndonCalls() {
    return useQuery({ queryKey: ['andon-calls'], queryFn: () => fetcher('/api/manufacturing/shopfloor?action=andon'), refetchInterval: 3_000 });
}

// === Budget ===
export function useBudgetVersions() {
    return useQuery({ queryKey: ['budget-versions'], queryFn: () => fetcher('/api/finance/budget') });
}

// === AI ===
export function useLlmCosts() {
    return useQuery({ queryKey: ['llm-costs'], queryFn: () => fetcher('/api/admin/llm-costs'), staleTime: 30_000 });
}

export function useConversations() {
    return useQuery({ queryKey: ['ai-conversations'], queryFn: () => fetcher('/api/ai/copilot/chat') });
}

// === Mutations ===
export function useCreateBudget() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => poster('/api/finance/budget', { action: 'create-version', ...data }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['budget-versions'] }),
    });
}

export function useUploadInvoice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => poster('/api/ap/capture', data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['invoice-captures'] }),
    });
}

export function useShopFloorAction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => poster('/api/manufacturing/shopfloor', data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['shopfloor-sessions'] });
            qc.invalidateQueries({ queryKey: ['andon-calls'] });
        },
    });
}

export function useAtpCheck() {
    return useMutation({
        mutationFn: (data: any) => poster('/api/sales/atp/check', data),
    });
}

export function useCopilotChat() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { message: string; conversationId?: string }) => poster('/api/ai/copilot/chat', data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-conversations'] }),
    });
}
