import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CompraService } from './compras.service';
import { CompraRequest, CompraProdutoRequest, CompraResponse } from './compras.model';
import { ProdutoService } from '../produtos/produtos.service';
import { UsuarioService } from '../usuarios/usuarios.service';
import { Produto } from '../produtos/produtos.model';
import { Usuario } from '../usuarios/usuarios.model';

interface ItemInsumo {
  produto: Produto;
  quantidade: number;
  valorCusto: number;
  subtotal: number;
}

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './compras.html',
  styleUrl: './compras.css'
})
export class Compras implements OnInit {

  // listas e historicos
  historicoCompras: CompraResponse[] = [];
  produtosDisponiveis: Produto[] = [];
  fornecedores: Usuario[] = [];

  // filtros para a listagem de registros
  filtroFornecedor: string = '';
  filtroDataInicio: string = '';
  filtroDataFim: string = '';

  // estado da nota de compra atual
  carrinhoInsumos: ItemInsumo[] = [];
  totalNotaEstoque = 0;

  // estruturas de formularios reativos
  compraForm: FormGroup;
  insumoForm: FormGroup;

  // controle de alternancia de telas
  exibindoNovaCompra = false;

  constructor(
    private compraService: CompraService,
    private produtoService: ProdutoService,
    private usuarioService: UsuarioService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    // valida campos principais do cabecalho da compra
    this.compraForm = this.fb.group({
      idFornecedor: ['', [Validators.required]],
      dataCompra: [new Date().toISOString().substring(0, 10), [Validators.required]]
    });

    // valida campos de cada insumo adicionado a nota
    this.insumoForm = this.fb.group({
      idProduto: ['', [Validators.required]],
      quantidade: [1, [Validators.required, Validators.min(0.001)]],
      valorCusto: ['', [Validators.required, Validators.min(0.01)]]
    });
  }

  ngOnInit(): void {
    // delay para carregar dados    
    setTimeout(() => {
      this.carregarDadosCompra();
    }, 100);
  }

  // carrega registros do back e coloca nos componentes
  carregarDadosCompra(): void {
    this.compraService.listar().subscribe({
      next: (dados) => {
        this.historicoCompras = [...dados];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao listar notas de compras', err)
    });

    this.produtoService.listar().subscribe({
      next: (dados) => {
        this.produtosDisponiveis = [...dados];
        this.cdr.detectChanges();
      }
    });

    this.usuarioService.listar().subscribe({
      next: (dados) => {
        // filtra deixando apenas do tipo fornecedor
        this.fornecedores = dados.filter(u => u.tipo === 'Fornecedor');
        this.cdr.detectChanges();
      }
    });
  }

  // calcula as notas de compras filtradas por fornecedor e periodo
  get comprasFiltradas(): CompraResponse[] {
    return this.historicoCompras.filter(compra => {
      if (this.filtroFornecedor && compra.nomeFornecedor !== this.filtroFornecedor) {
        return false;
      }
      if (this.filtroDataInicio && compra.dataCompra < this.filtroDataInicio) {
        return false;
      }
      if (this.filtroDataFim && compra.dataCompra > this.filtroDataFim) {
        return false;
      }
      return true;
    });
  }

  // zerar e mudar interface de exibicao
  alternarTelaNovaCompra(exibir: boolean): void {
    this.exibindoNovaCompra = exibir;
    if (exibir) {
      this.carrinhoInsumos = [];
      this.totalNotaEstoque = 0;
      this.compraForm.reset({ dataCompra: new Date().toISOString().substring(0, 10) });
      this.insumoForm.reset({ quantidade: 1 });
    }
    this.cdr.detectChanges();
  }

  // valida e inclui insumos na listagem temporaria da nota
  adicionarInsumo(): void {
    if (this.insumoForm.invalid) {
      this.insumoForm.markAllAsTouched();
      return;
    }

    const idProd = Number(this.insumoForm.value.idProduto);
    const qtd = Number(this.insumoForm.value.quantidade);
    const custo = Number(this.insumoForm.value.valorCusto);

    const produtoObj = this.produtosDisponiveis.find(p => p.id === idProd);
    if (!produtoObj) return;

    const itemExistente = this.carrinhoInsumos.find(item => item.produto.id === idProd);
    if (itemExistente) {
      // soma quantidade e atualiza custo se ja foi listado
      itemExistente.quantidade += qtd;
      itemExistente.valorCusto = custo;
      itemExistente.subtotal = itemExistente.quantidade * custo;
    } else {
      // insere registro novo no array da nota 
      this.carrinhoInsumos.push({
        produto: produtoObj,
        quantidade: qtd,
        valorCusto: custo,
        subtotal: qtd * custo
      });
    }

    this.atualizarValoresNota();
    this.insumoForm.reset({ quantidade: 1 });
  }

  // remove do array baseado na posicao do indice
  removerInsumo(index: number): void {
    this.carrinhoInsumos.splice(index, 1);
    this.atualizarValoresNota();
  }

  // atualiza somatorio final da nota do fornecedor
  atualizarValoresNota(): void {
    this.totalNotaEstoque = this.carrinhoInsumos.reduce((acc, item) => acc + item.subtotal, 0);
    this.cdr.detectChanges();
  }

  // envia o objeto com os dados 
  finalizarOrdemCompra(): void {
    if (this.compraForm.invalid) {
      this.compraForm.markAllAsTouched();
      alert('Por favor, preencha todos os dados da nota fiscal de entrada.');
      return;
    }

    if (this.carrinhoInsumos.length === 0) {
      alert('Adicione pelo menos um produto para dar entrada no estoque.');
      return;
    }

    // mapeia  da interface para o formato dto do back
    const itensRequest: CompraProdutoRequest[] = this.carrinhoInsumos.map(item => ({
      idProduto: item.produto.id!,
      quantidade: item.quantidade,
      valor: item.valorCusto
    }));

    const dadosCompra: CompraRequest = {
      idFornecedor: Number(this.compraForm.value.idFornecedor),
      dataCompra: this.compraForm.value.dataCompra,
      valorCompra: this.totalNotaEstoque,
      itens: itensRequest
    };

    this.compraService.criar(dadosCompra).subscribe({
      next: () => {
        alert('Entrada de insumos realizada e estoque updated com sucesso!');
        this.alternarTelaNovaCompra(false);
        this.carregarDadosCompra();
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'Erro ao registrar entrada de mercadoria.');
      }
    });
  }

  // cancela ou exclui uma nota antiga voltando o saldo do estoque
  deletarNotaCompra(id: number): void {
    if (confirm('Atenção: ao excluir esta compra a quantidade adicionada será subtraída do estoque. Deseja continuar?')) {
      this.compraService.excluir(id).subscribe({
        next: () => {
          this.carregarDadosCompra();
        },
        error: (err) => console.error('Erro ao deletar nota de compra.', err)
      });
    }
  }
}