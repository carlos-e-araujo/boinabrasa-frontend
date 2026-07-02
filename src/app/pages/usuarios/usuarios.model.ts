export interface Usuario {
  id?: number;
  nome: string;
  email: string;
  cpfCnpj: string;
  tipo: 'Gerente' | 'Acougueiro' | 'Atendente' | 'Fornecedor';
}