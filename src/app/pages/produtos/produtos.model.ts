export interface Produto {
  id?: number;
  descricao: string;
  valor: number;
  unidade: string;
  quantidadeEstoque: number;
  controleEstoque: boolean;
  ativo?: boolean; 
}