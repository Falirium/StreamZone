import { getAuditLogs } from './actions';
import { AuditClient } from './audit-client';

export const metadata = { title: 'Audit Logs — Admin' };

interface Props {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function AuditLogsPage({ searchParams }: Props) {
  const { page, search } = await searchParams;
  const pageNum = parseInt(page || '1', 10);
  const result = await getAuditLogs(pageNum, 20, search);
  
  const logs = (result.data?.logs || []).map(log => ({
    ...log,
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <AuditClient 
      logs={logs} 
      total={result.data?.total || 0} 
      page={result.data?.page || 1} 
      pageSize={result.data?.pageSize || 20} 
    />
  );
}
