import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProdutoService } from '../produtos/produtos.service';
import { UsuarioService } from '../usuarios/usuarios.service';
import { VendaService } from '../vendas/vendas.service';
import { Produto } from '../produtos/produtos.model';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit {

  totalProdutos = 0;
  totalUsuarios = 0;
  totalVendas = 0;
  produtosEstoqueBaixo: Produto[] = [];
  ultimaSincronizacao = '';

  constructor(
    private produtoService: ProdutoService,
    private usuarioService: UsuarioService,
    private vendaService: VendaService, 
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.ultimaSincronizacao = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setTimeout(() => {
      this.carregarDados();
    }, 100);
  }

  carregarDados(): void {
    this.produtoService.listar().subscribe({
      next: (produtos) => {
        this.totalProdutos = produtos.length;
        this.produtosEstoqueBaixo = produtos.filter(p => p.controleEstoque && p.quantidadeEstoque <= 10);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar produtos', err)
    });

    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        this.totalUsuarios = usuarios.length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar usuários', err)
    });

    this.vendaService.listar().subscribe({
      next: (vendas) => {
        this.totalVendas = vendas.length; 
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erro ao carregar volume de vendas', err)
    });
  }
}