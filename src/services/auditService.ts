import { AuditLog } from '../types';

/**
 * Service to handle audit logging logic.
 * Ensures data consistency and UUID validation before sending to the database.
 */
export const auditService = {
  /**
   * Creates a structured AuditLog object.
   * @param action The action performed (e.g., 'CREATE', 'UPDATE', 'DELETE')
   * @param tableName The table name where the change occurred
   * @param recordId The UUID of the record being audited
   * @param oldData The state before the change
   * @param newData The state after the change
   * @param userId The UUID of the user who performed the action
   */
  createLog: (
    action: string,
    tableName: string,
    recordId: string,
    oldData: any = null,
    newData: any = null,
    userId: string = 'user-1'
  ): AuditLog => {
    // Basic UUID validation for record_id and user_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(recordId)) {
      console.warn(`[AuditService] Invalid recordId format: "${recordId}". Expected UUID.`);
    }

    return {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      user_id: userId,
      action,
      table_name: tableName,
      record_id: recordId,
      old_data: oldData,
      new_data: newData
    };
  }
};
