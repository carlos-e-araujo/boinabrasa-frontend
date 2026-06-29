export interface CompraProdutoRequest {
  idProduto: number;
  quantidade: number;
  valor: number; // preco de custo pago ao fornecedor
}

export interface CompraRequest {
  dataCompra: string; 
  valorCompra: number; // somatorio calculado dos itens
  idFornecedor: number;
  itens: CompraProdutoRequest[];
}

export interface CompraProdutoResponse {
  idProduto: number;
  descricaoProduto: string;
  quantidade: number;
  valor: number;
}

export interface CompraResponse {
  id: number;
  dataCompra: string;
  valorCompra: number;
  nomeFornecedor: string;
  itens: CompraProdutoResponse[];
}