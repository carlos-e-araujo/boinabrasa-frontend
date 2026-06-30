import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VendaService } from '../vendas/vendas.service';
import { CompraService } from '../compras/compras.service';
import { VendaResponse } from '../vendas/vendas.model';
import { CompraResponse } from '../compras/compras.model';

interface RankingItem {
  nome: string;
  valorTotal: number;
  quantidade: number;
  porcentagem?: number;
  grauInicio?: number; // angulo inicial da fatia no grafico pizza
  grauFim?: number;    // angulo final da fatia no grafico pizza
  corHex?: string;     // cor exclusiva mapeada para o corte
}

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.css',
})
export class Relatorios implements OnInit {

  vendasCarregadas: VendaResponse[] = [];
  comprasCarregadas: CompraResponse[] = [];

  totalReceitaVendas = 0;
  totalCustoCompras = 0;
  saldoBalancoNet = 0;
  ticketMedioVendas = 0;

  quantidadeCuponsVenda = 0;
  quantidadeNotasCompra = 0;

  rankingFuncionarios: RankingItem[] = [];
  rankingProdutos: RankingItem[] = [];
  rankingFornecedores: RankingItem[] = [];
  
  // string de estilo que alimentara o gradiente conico do css da pizza
  estiloGraficoPizza = 'conic-gradient(#dee2e6 0deg 360deg)';

  // paleta de cores executivas para os cortes de carne
  private coresPizza = ['#dc3545', '#fd7e14', '#ffc107', '#198754', '#0d6efd', '#6f42c1'];

  constructor(
    private vendaService: VendaService,
    private compraService: CompraService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.gerarMetricasGerenciais();
    }, 100);
  }

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
      error: (err) => console.error('erro ao buscar vendas para relatorio', err)
    });

    this.compraService.listar().subscribe({
      next: (compras) => {
        this.comprasCarregadas = [...compras];
        this.quantidadeNotasCompra = compras.length;
        this.totalCustoCompras = compras.reduce((acc, c) => acc + c.valorCompra, 0);
        
        this.processarRankingFornecedores();
        this.recalcularSaldoFinal();
      },
      error: (err) => console.error('erro ao buscar compras para relatorio', err)
    });
  }

  recalcularSaldoFinal(): void {
    this.saldoBalancoNet = this.totalReceitaVendas - this.totalCustoCompras;
    this.cdr.detectChanges();
  }

  calcularTicketMedio(): void {
    this.ticketMedioVendas = this.quantidadeCuponsVenda > 0 ? this.totalReceitaVendas / this.quantidadeCuponsVenda : 0;
  }

  processarRankingFuncionarios(): void {
    const mapa = new Map<string, { valor: number, qtd: number }>();
    this.vendasCarregadas.forEach(venda => {
      const atual = mapa.get(venda.nomePessoa) || { valor: 0, qtd: 0 };
      mapa.set(venda.nomePessoa, { valor: atual.valor + venda.valorTotal, qtd: atual.qtd + 1 });
    });

    const resultado: RankingItem[] = [];
    mapa.forEach((info, nome) => resultado.push({ nome, valorTotal: info.valor, quantidade: info.qtd }));
    resultado.sort((a, b) => b.valorTotal - a.valorTotal);

    const maiorValor = resultado[0]?.valorTotal || 1;
    this.rankingFuncionarios = resultado.map(item => ({
      ...item,
      porcentagem: (item.valorTotal / maiorValor) * 100
    }));
  }

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

    // ordena do produto com maior quantidade para o menor
    resultado.sort((a, b) => b.quantidade - a.quantidade);

    // calcula a barra percentual proporcional ao primeiro colocado
    const maiorQtd = resultado[0]?.quantidade || 1;
    this.rankingProdutos = resultado.map(item => ({
      ...item,
      porcentagem: (item.quantidade / maiorQtd) * 100
    }));
  }

  processarRankingFornecedores(): void {
    const mapa = new Map<string, { valor: number, qtd: number }>();
    this.comprasCarregadas.forEach(compra => {
      const atual = mapa.get(compra.nomeFornecedor) || { valor: 0, qtd: 0 };
      mapa.set(compra.nomeFornecedor, { valor: atual.valor + compra.valorCompra, qtd: atual.qtd + 1 });
    });

    const resultado: RankingItem[] = [];
    mapa.forEach((info, nome) => resultado.push({ nome, valorTotal: info.valor, quantidade: info.qtd }));
    resultado.sort((a, b) => b.valorTotal - a.valorTotal);

    const maiorGasto = resultado[0]?.valorTotal || 1;
    this.rankingFornecedores = resultado.map(item => ({
      ...item,
      porcentagem: (item.valorTotal / maiorGasto) * 100
    }));
  }
}