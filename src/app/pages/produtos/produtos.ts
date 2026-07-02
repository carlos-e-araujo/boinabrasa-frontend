import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Produto } from './produtos.model';
import { ProdutoService } from './produtos.service';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './produtos.html',
  styleUrl: './produtos.css'
})
export class Produtos implements OnInit {

  produtos: Produto[] = [];
  produtoForm: FormGroup;
  exibindoModal = false;
  modoEdicao = false;
  idProdutoEmEdicao: number | null = null;

  // guardar o termo digitado na barra de busca
  termoBusca: string = '';

  constructor(
    private produtoService: ProdutoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef // isso aq ajuda o Angular a renderizar na hora, pq em outros testes tava um delay absurdo
  ) {
    this.produtoForm = this.fb.group({
      descricao: ['', [Validators.required]],
      valor: ['', [Validators.required, Validators.min(0.01)]],
      unidade: ['kg', [Validators.required]],
      quantidadeEstoque: [0], // validacao reativa  
      controleEstoque: [true, [Validators.required]]
    });
  }

  ngOnInit(): void {
    // um timeout leve para garantir que o componente terminou a inciailizacao
    setTimeout(() => {
      this.carregarProdutos();
    }, 100);
  }

  carregarProdutos(): void {
    this.produtoService.listar().subscribe({
      next: (dados) => {
        this.produtos = [...dados]; 
        this.cdr.detectChanges(); // atualizacao visual da tabela
      },
      error: (erro) => console.error('Erro ao carregar produtos', erro)
    });
  }

  // calcula a lista filtrada em tempo real pela descricao
  get produtosFiltrados(): Produto[] {
    if (!this.termoBusca.trim()) {
      return this.produtos;
    }
    return this.produtos.filter(p => 
      p.descricao.toLowerCase().includes(this.termoBusca.toLowerCase())
    );
  }

  abrirModalNovo(): void {
    this.modoEdicao = false;
    this.idProdutoEmEdicao = null;
    this.produtoForm.reset({ unidade: 'kg', quantidadeEstoque: 0, controleEstoque: true });
    
    // desabilita o campo impedindo digitacao inicial
    this.produtoForm.get('quantidadeEstoque')?.disable();
    this.exibindoModal = true;
  }

  abrirModalEditar(produto: Produto): void {
    this.modoEdicao = true;
    this.idProdutoEmEdicao = produto.id ?? null;
    this.produtoForm.reset();
    
    // na edicao mantem desabilitado apenas leitura 
    this.produtoForm.get('quantidadeEstoque')?.disable();
    this.produtoForm.patchValue(produto);
    this.exibindoModal = true;
  }

  fecharModal(): void {
    this.exibindoModal = false;
    this.cdr.detectChanges();
  }

  salvar(): void {
    if (this.produtoForm.invalid) {
      this.produtoForm.markAllAsTouched();
      return;
    }

    const dadosProduto: Produto = this.produtoForm.getRawValue();

    if (this.modoEdicao && this.idProdutoEmEdicao !== null) {
      this.produtoService.alterar(this.idProdutoEmEdicao, dadosProduto).subscribe({
        next: () => {
          this.fecharModal();
          this.carregarProdutos(); // recarrega a lista limpa vinda do banco
        },
        error: (err) => console.error('Erro ao alterar produto', err)
      });
    } else {
      this.produtoService.criar(dadosProduto).subscribe({
        next: () => {
          this.fecharModal();
          this.carregarProdutos(); // recarrega a lista limpa vinda do banco
        },
        error: (err) => console.error('Erro ao criar produto', err)
      });
    }
  }

  deletarProduto(id?: number): void {
    if (!id) return;
    
    if (confirm('Deseja realmente excluir este produto do catálogo?')) {
      this.produtoService.excluir(id).subscribe({
        next: () => {
          this.carregarProdutos(); // atualiza a lista removendo o item inativa (ou seja excluido)
        },
        error: (err) => console.error('Erro ao deletar produto', err)
      });
    }
  }
}