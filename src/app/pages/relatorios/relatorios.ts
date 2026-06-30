import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VendaService } from '../vendas/vendas.service';
import { CompraService } from '../compras/compras.service';
import { VendaResponse } from '../vendas/vendas.model';
import { CompraResponse } from '../compras/compras.model';

// estrutura para os rankings dos graficos
interface RankingItem {
  nome: string;
  valorTotal: number;
  quantidade: number;
  porcentagem?: number;
}

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.css',
})
export class Relatorios implements OnInit {

  // listas de dados q vem da api
  vendasCarregadas: VendaResponse[] = [];
  comprasCarregadas: CompraResponse[] = [];

  // contadores dos cards 
  totalReceitaVendas = 0;
  totalCustoCompras = 0;
  saldoBalancoNet = 0;
  ticketMedioVendas = 0;

  // contadores de volume total
  quantidadeCuponsVenda = 0;
  quantidadeNotasCompra = 0;

  // arrays das listas e barras do template
  rankingFuncionarios: RankingItem[] = [];
  rankingProdutos: RankingItem[] = [];
  rankingFornecedores: RankingItem[] = [];

  constructor(
    private vendaService: VendaService,
    private compraService: CompraService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // delay de seguranca carregar layout
    setTimeout(() => {
      this.gerarMetricasGerenciais();
    }, 100);
  }

  // dispara a busca em paralelo de vendas e compras
  gerarMetricasGerenciais(): void {
    this.vendaService.listar().subscribe({
      next: (vendas) => {
        this.vendasCarregadas = [...vendas];
        this.quantidadeCuponsVenda = vendas.length;
        this.totalReceitaVendas = vendas.reduce((acc, v) => acc + v.valorTotal, 0);
        
        this.calcularTicketMedio();
        this.processarRankingFuncionarios();
        this.processarRankingProdutos();
        this.recalcularSaldoFinal();
      },
      error: (err) => console.error('Erro ao buscar vendas para relatório', err)
    });

    this.compraService.listar().subscribe({
      next: (compras) => {
        this.comprasCarregadas = [...compras];
        this.quantidadeNotasCompra = compras.length;
        this.totalCustoCompras = compras.reduce((acc, c) => acc + c.valorCompra, 0);
        
        this.processarRankingFornecedores();
        this.recalcularSaldoFinal();
      },
      error: (err) => console.error('Erro ao buscar compras para relatório', err)
    });
  }

  // calcula a diferenca entre receitas e custos
  recalcularSaldoFinal(): void {
    this.saldoBalancoNet = this.totalReceitaVendas - this.totalCustoCompras;
    this.cdr.detectChanges();
  }

  // calcula o valor medio gasto por venda emitido
  calcularTicketMedio(): void {
    this.ticketMedioVendas = this.quantidadeCuponsVenda > 0 
      ? this.totalReceitaVendas / this.quantidadeCuponsVenda 
      : 0;
  }

  // agrupa vendas por funcionario e  percentual do grafico
  processarRankingFuncionarios(): void {
    const mapa = new Map<string, { valor: number, qtd: number }>();

    this.vendasCarregadas.forEach(venda => {
      const atual = mapa.get(venda.nomePessoa) || { valor: 0, qtd: 0 };
      mapa.set(venda.nomePessoa, {
        valor: atual.valor + venda.valorTotal,
        qtd: atual.qtd + 1
      });
    });

    const resultado: RankingItem[] = [];
    mapa.forEach((info, nome) => {
      resultado.push({ nome, valorTotal: info.valor, quantidade: info.qtd });
    });

    resultado.sort((a, b) => b.valorTotal - a.valorTotal);

    const maiorValor = resultado[0]?.valorTotal || 1;
    this.rankingFuncionarios = resultado.map(item => ({
      ...item,
      porcentagem: (item.valorTotal / maiorValor) * 100
    }));
  }

  // quebra os itens dos cupons para somar os cortes mais vendidos em volume
  processarRankingProdutos(): void {
    const mapa = new Map<string, { valor: number, qtd: number }>();

    this.vendasCarregadas.forEach(venda => {
      venda.itens.forEach(item => {
        const atual = mapa.get(item.descricaoProduto) || { valor: 0, qtd: 0 };
        mapa.set(item.descricaoProduto, {
          valor: atual.valor + (item.quantidade * item.valor),
          qtd: atual.qtd + item.quantidade
        });
      });
    });

    const resultado: RankingItem[] = [];
    mapa.forEach((info, nome) => {
      resultado.push({ nome, valorTotal: info.valor, quantidade: info.qtd });
    });

    resultado.sort((a, b) => b.quantidade - a.quantidade);

    const maiorQtd = resultado[0]?.quantidade || 1;
    this.rankingProdutos = resultado.map(item => ({
      ...item,
      porcentagem: (item.quantidade / maiorQtd) * 100
    }));
  }

  // agrupa notas de compras pelo nome do fornecedor 
  processarRankingFornecedores(): void {
    const mapa = new Map<string, { valor: number, qtd: number }>();

    this.comprasCarregadas.forEach(compra => {
      const atual = mapa.get(compra.nomeFornecedor) || { valor: 0, qtd: 0 };
      mapa.set(compra.nomeFornecedor, {
        valor: atual.valor + compra.valorCompra,
        qtd: atual.qtd + 1
      });
    });

    const resultado: RankingItem[] = [];
    mapa.forEach((info, nome) => {
      resultado.push({ nome, valorTotal: info.valor, quantidade: info.qtd });
    });

    resultado.sort((a, b) => b.valorTotal - a.valorTotal);

    const maiorGasto = resultado[0]?.valorTotal || 1;
    this.rankingFornecedores = resultado.map(item => ({
      ...item,
      porcentagem: (item.valorTotal / maiorGasto) * 100
    }));
  }
}