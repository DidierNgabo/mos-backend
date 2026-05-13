export interface QueryUserBulkInviteResult {
  total: number;
  successes: string[];
  failures: Array<{ row: number; email?: string; error: string }>;
}
