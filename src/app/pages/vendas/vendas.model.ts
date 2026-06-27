// o que o Angular envia para o Spring Boot realizar a venda
export interface VendaItemRequest {
  idProduto: number;
  quantidade: number; // aceitar decimais
}

export interface VendaRequest {
  idPessoa: number; // id de quem ta vendendo
  itens: VendaItemRequest[];
}

// Spring Boot devolve dps de salvar a venda
export interface VendaItemResponse {
  idProduto: number;
  descricaoProduto: string;
  quantidade: number;
  valor: number;
}

export interface VendaResponse {
  id: number;
  data: string; // LocalDateTime vira string 
  valorTotal: number;
  idPessoa: number;
  nomePessoa: string;
  itens: VendaItemResponse[];
}