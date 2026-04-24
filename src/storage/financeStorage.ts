import { Installment, Transaction } from '../types';
import { MOCK_INSTALLMENTS } from '../mockData';
import { storage } from './base';
import { STORAGE_KEYS } from '../config/storageKeys';

const KEY = STORAGE_KEYS.FINANCE;

export const financeStorage = {
  get: () => {
    const data = storage.get(KEY, { installments: MOCK_INSTALLMENTS, transactions: [] });
    return {
      installments: Array.isArray(data?.installments) ? data.installments : MOCK_INSTALLMENTS,
      transactions: Array.isArray(data?.transactions) ? data.transactions : [],
    };
  },
  save: (data: { installments: Installment[], transactions: Transaction[] }) => {
    storage.set(KEY, data);
  }
};
