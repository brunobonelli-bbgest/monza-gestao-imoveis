import { Lease, Property } from '../../types';

/**
 * Checks if a property has at least one active lease.
 */
export const hasActiveLeaseForProperty = (propertyId: string, leases: Lease[]): boolean => {
  return leases.some(l => l.propertyId === propertyId && l.status === 'active');
};

/**
 * Computes the correct status for a property based on its active leases.
 * Rule: A property can only be 'rented' if it has an active lease.
 */
export const computePropertyStatus = (property: Property, leases: Lease[]): 'rented' | 'vacant' | 'maintenance' => {
  if (property.isUnderMaintenance) {
    return 'maintenance';
  }
  
  const hasActive = hasActiveLeaseForProperty(property.id, leases);
  
  return hasActive ? 'rented' : 'vacant';
};

/**
 * Iterates through leases and marks those that have passed their end date as 'expired'.
 */
export const expireLeasesIfNeeded = (leases: Lease[]): { updatedLeases: Lease[], changed: boolean } => {
  const today = new Date().toISOString().split('T')[0];
  let changed = false;
  
  const updatedLeases = leases.map(l => {
    if (l.status === 'active' && l.endDate < today) {
      changed = true;
      return { ...l, status: 'expired' as const };
    }
    return l;
  });
  
  return { updatedLeases, changed };
};
