import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VendaService } from './vendas.service';
import { VendaRequest, VendaItemRequest, VendaResponse } from './vendas.model';
import { ProdutoService } from '../produtos/produtos.service';
import { UsuarioService } from '../usuarios/usuarios.service';
import { Produto } from '../produtos/produtos.model';
import { Usuario } from '../usuarios/usuarios.model';

// estrutura para exibir itens no carrinho da tela
interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
  subtotal: number;
}

@Component({
  selector: 'app-vendas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './vendas.html',
  styleUrl: './vendas.css'
})
export class Vendas implements OnInit {

  // listas de dados do sistema
  historicoVendas: VendaResponse[] = [];
  produtosDisponiveis: Produto[] = [];
  funcionarios: Usuario[] = [];

  // filtros para a listagem de registros
  filtroFuncionario: string = '';
  filtroDataInicio: string = '';
  filtroDataFim: string = '';

  // estado da venda atual
  carrinho: ItemCarrinho[] = [];
  valorTotalCarrinho = 0;

  // gerenciadores dos formularios da tela
  vendaForm: FormGroup;
  itemForm: FormGroup;

  // controle de navegacao entre as telas de listagem e venda
  exibindoNovaVenda = false;

  constructor(
    private vendaService: VendaService,
    private produtoService: ProdutoService,
    private usuarioService: UsuarioService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    // valida se o funcionario foi selecionado
    this.vendaForm = this.fb.group({
      idPessoa: ['', [Validators.required]]
    });

    // valida os campos do produto antes de inserir no carrinho
    this.itemForm = this.fb.group({
      idProduto: ['', [Validators.required]],
      quantidade: [1, [Validators.required, Validators.min(0.001)]]
    });
  }

  ngOnInit(): void {
    // delay para garantir inicializacao correta dos dados
    setTimeout(() => {
      this.carregarHistorico();
      this.carregarAuxiliares();
    }, 100);
  }

  // busca todas as vendas ja salvas no banco
  carregarHistorico(): void {
    this.vendaService.listar().subscribe({
      next: (dados) => {
        this.historicoVendas = [...dados];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar histórico de vendas', err)
    });
  }

  // carrega dados de produtos ativos e funcionarios para os selects
  carregarAuxiliares(): void {
    this.produtoService.listar().subscribe({
      next: (dados) => {
        this.produtosDisponiveis = [...dados];
        this.cdr.detectChanges();
      }
    });

    this.usuarioService.listar().subscribe({
      next: (dados) => {
        // filtra deixando apenas quem opera o caixa
        this.funcionarios = dados.filter(u => u.tipo === 'Atendente' || u.tipo === 'Acougueiro' || u.tipo === 'Gerente');
        this.cdr.detectChanges();
      }
    });
  }

  // calcula as vendas filtradas por periodo e operador do caixa
  get vendasFiltradas(): VendaResponse[] {
    return this.historicoVendas.filter(venda => {
      if (this.filtroFuncionario && venda.nomePessoa !== this.filtroFuncionario) {
        return false;
      }
      const dataVendaStr = venda.data.substring(0, 10);
      if (this.filtroDataInicio && dataVendaStr < this.filtroDataInicio) {
        return false;
      }
      if (this.filtroDataFim && dataVendaStr > this.filtroDataFim) {
        return false;
      }
      return true;
    });
  }

  // limpa o carrinho e troca a interface   
  alternarTelaNovaVenda(exibir: boolean): void {
    this.exibindoNovaVenda = exibir;
    if (exibir) {
      this.carrinho = [];
      this.valorTotalCarrinho = 0;
      this.vendaForm.reset();
      this.itemForm.reset({ quantidade: 1 });
    }
    this.cdr.detectChanges();
  }

  // adiciona ou soma quantidade de um item na venda atual
  adicionarAoCarrinho(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    const idProd = Number(this.itemForm.value.idProduto);
    const qtd = Number(this.itemForm.value.quantidade);

    const produtoObj = this.produtosDisponiveis.find(p => p.id === idProd);
    if (!produtoObj) return;

    //  bloqueia fracionar un ou peca 
    const un = produtoObj.unidade.toLowerCase();
    if ((un === 'un' || un === 'peça' || un === 'pc') && qtd % 1 !== 0) {
      alert(`O produto "${produtoObj.descricao}" é vendido por unidade/peça e não pode ser fracionado!`);
      return;
    }

    // checagem de estoque no front para itens com controle ativo
    if (produtoObj.controleEstoque && produtoObj.quantidadeEstoque < qtd) {
      alert(`Estoque insuficiente! Disponível no momento: ${produtoObj.quantidadeEstoque} ${produtoObj.unidade}.`);
      return;
    }

    const itemExistente = this.carrinho.find(item => item.produto.id === idProd);
    if (itemExistente) {
      // se ja lancou antes é só somar a quantidade
      itemExistente.quantidade += qtd;
      itemExistente.subtotal = itemExistente.quantidade * itemExistente.produto.valor;
    } else {
      // insere linha nova se o produto nao estava no carrinho
      const subtotal = qtd * produtoObj.valor;
      this.carrinho.push({
        produto: produtoObj,
        quantidade: qtd,
        subtotal: subtotal
      });
    }

    this.atualizarTotalCarrinho();
    this.itemForm.reset({ quantidade: 1 });
  }

  // retira um item especifico do array do carrinho
  removerDoCarrinho(index: number): void {
    this.carrinho.splice(index, 1);
    this.atualizarTotalCarrinho();
  }

  // recalcula o somatorio financeiro dos itens na tela
  atualizarTotalCarrinho(): void {
    this.valorTotalCarrinho = this.carrinho.reduce((acc, item) => acc + item.subtotal, 0);
    this.cdr.detectChanges();
  }

  // monta a estrutura final do dto 
  finalizarVenda(): void {
    if (this.vendaForm.invalid) {
      this.vendaForm.markAllAsTouched();
      alert('Por favor, selecione o funcionário responsável pela venda.');
      return;
    }

    if (this.carrinho.length === 0) {
      alert('O carrinho de compras está vazio. Adicione pelo menos uma carne.');
      return;
    }

    // isola apenas os atributos id e quantidade necessarios para o back
    const itensRequest: VendaItemRequest[] = this.carrinho.map(item => ({
      idProduto: item.produto.id!,
      quantidade: item.quantidade
    }));

    const dadosVenda: VendaRequest = {
      idPessoa: Number(this.vendaForm.value.idPessoa),
      itens: itensRequest
    };

    this.vendaService.criar(dadosVenda).subscribe({
      next: () => {
        alert('Venda realizada e registrada com sucesso!');
        this.alternarTelaNovaVenda(false);
        this.carregarHistorico();
      },
      error: (err) => {
        console.error(err);
        // exibir mensagem de erro do back
        alert(err.error?.message || 'Erro inesperado ao fechar a venda.');
      }
    });
  }
}