import { Property, Owner, Tenant, Lease, Installment, Incident, Inspection, Vendor } from './types';

export const MOCK_OWNERS: Owner[] = [
  {
    id: 'o1',
    name: 'Carlos Alberto Silva',
    document: '123.456.789-00',
    email: 'carlos.silva@email.com',
    phone: '(11) 98765-4321',
    address: 'Rua das Palmeiras, 100, São Paulo - SP',
    bankName: 'Banco do Brasil',
    bankAgency: '1234',
    bankAccount: '56789-0',
    pixKey: '123.456.789-00',
    reportPreference: 'monthly',
  },
  {
    id: 'o2',
    name: 'Maria Eduarda Santos',
    document: '987.654.321-11',
    email: 'maria.santos@email.com',
    phone: '(11) 91234-5678',
    address: 'Av. Paulista, 1500, São Paulo - SP',
    bankName: 'Itaú',
    bankAgency: '4321',
    bankAccount: '98765-4',
    pixKey: 'maria.santos@email.com',
    reportPreference: 'quarterly',
  }
];

export const MOCK_TENANTS: Tenant[] = [
  {
    id: 't1',
    name: 'João Pereira',
    document: '111.222.333-44',
    email: 'joao.p@email.com',
    phone: '(11) 99999-8888',
    occupation: 'Engenheiro de Software',
    income: 8500,
  },
  {
    id: 't2',
    name: 'Ana Beatriz Costa',
    document: '555.666.777-88',
    email: 'ana.costa@email.com',
    phone: '(11) 97777-6666',
    occupation: 'Designer',
    income: 6200,
  },
  {
    id: 't3',
    name: 'Roberto Almeida',
    document: '444.555.666-77',
    email: 'roberto.a@email.com',
    phone: '(11) 96666-5555',
    occupation: 'Advogado',
    income: 12000,
  }
];

export const MOCK_PROPERTIES: Property[] = [
  {
    id: 'p1',
    title: 'Apartamento Moderno Vila Nova',
    address: 'Rua João Cachoeira, 450, Vila Nova Conceição',
    city: 'São Paulo',
    neighborhood: 'Vila Nova Conceição',
    status: 'rented',
    isUnderMaintenance: false,
    type: 'apartment',
    rentValue: 4500,
    ownerId: 'o1',
    images: ['https://picsum.photos/seed/apt1/800/600'],
  },
  {
    id: 'p2',
    title: 'Casa de Condomínio Alphaville',
    address: 'Alameda Rio Negro, 1200, Alphaville',
    city: 'Barueri',
    neighborhood: 'Alphaville',
    status: 'vacant',
    isUnderMaintenance: false,
    type: 'house',
    rentValue: 12000,
    ownerId: 'o2',
    images: ['https://picsum.photos/seed/house1/800/600'],
  },
  {
    id: 'p3',
    title: 'Studio Loft Pinheiros',
    address: 'Rua dos Pinheiros, 800, Pinheiros',
    city: 'São Paulo',
    neighborhood: 'Pinheiros',
    status: 'vacant',
    isUnderMaintenance: true,
    type: 'studio',
    rentValue: 3200,
    ownerId: 'o1',
    images: ['https://picsum.photos/seed/studio1/800/600'],
  }
];

export const MOCK_LEASES: Lease[] = [
  {
    id: 'l1',
    contractNumber: '2024-0001',
    propertyId: 'p1',
    ownerId: 'o1',
    tenantId: 't1',
    startDate: '2023-01-01',
    endDate: '2025-12-31',
    rentValue: 4500,
    adjustmentIndex: 'IPCA',
    deposit: 13500,
    dueDay: 10,
    fees: { condo: 800, tax: 200 },
    status: 'active',
    managementFee: 10,
  }
];

export const MOCK_INSTALLMENTS: Installment[] = [
  {
    id: 'i1',
    leaseId: 'l1',
    dueDate: '2024-02-10',
    value: 5500,
    status: 'paid',
    paidAt: '2024-02-08',
    agencyFeeValue: 550,
    agencyFeeStatus: 'collected',
    ownerValue: 4950,
    remittanceStatus: 'completed',
    remittanceDate: '2024-02-12',
  },
  {
    id: 'i2',
    leaseId: 'l1',
    dueDate: '2024-03-10',
    value: 5500,
    status: 'overdue',
    agencyFeeValue: 550,
    agencyFeeStatus: 'pending',
    ownerValue: 4950,
    remittanceStatus: 'pending',
  },
  {
    id: 'i3',
    leaseId: 'l1',
    dueDate: '2024-04-10',
    value: 5500,
    status: 'pending',
    agencyFeeValue: 550,
    agencyFeeStatus: 'pending',
    ownerValue: 4950,
    remittanceStatus: 'pending',
  }
];

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'inc1',
    propertyId: 'p1',
    leaseId: 'l1',
    category: 'maintenance',
    description: 'Vazamento na pia da cozinha',
    status: 'open',
    responsible: 'João Encanador',
    createdAt: '2024-02-15',
    cost: 150,
    vendorId: 'v1'
  }
];

export const MOCK_INSPECTIONS: Inspection[] = [
  {
    id: 'insp1',
    propertyId: 'p1',
    type: 'entry',
    date: '2023-01-01',
    status: 'completed',
    summary: 'Imóvel em perfeitas condições',
    items: [
      { room: 'Sala', item: 'Pintura', condition: 'ok' }
    ]
  }
];

export const MOCK_VENDORS: Vendor[] = [
  {
    id: 'v1',
    name: 'João Encanador',
    service: 'Hidráulica',
    contact: 'João Silva',
    email: 'joao.encanador@email.com',
    phone: '(11) 98888-7777',
    city: 'São Paulo',
    availability: 'Seg-Sex, 08:00-18:00',
    averageCost: 150,
    rating: 4.8,
    avatar: 'https://picsum.photos/seed/v1/200/200',
    bio: 'Especialista em detecção de vazamentos e reparos hidráulicos residenciais com mais de 15 anos de experiência.',
    completedJobs: 124,
    skills: ['Vazamentos', 'Pias', 'Vasos Sanitários', 'Tubulações']
  },
  {
    id: 'v2',
    name: 'Eletro-Rápido',
    service: 'Elétrica',
    contact: 'Marcos Oliveira',
    email: 'contato@eletrorapido.com',
    phone: '(11) 97777-6666',
    city: 'São Paulo',
    availability: '24h / Emergências',
    averageCost: 200,
    rating: 4.9,
    avatar: 'https://picsum.photos/seed/v2/200/200',
    bio: 'Serviços elétricos de emergência e instalações completas. Certificado NR10.',
    completedJobs: 89,
    skills: ['Quadros Elétricos', 'Fiação', 'Iluminação', 'Ar Condicionado']
  }
];
