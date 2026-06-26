import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Usuario } from './usuarios.model';
import { UsuarioService } from './usuarios.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class Usuarios implements OnInit {

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  filtroAtual = '';
  usuarioForm: FormGroup;
  exibindoModal = false;
  modoEdicao = false;
  idUsuarioEmEdicao: number | null = null;

  constructor(
    private usuarioService: UsuarioService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.usuarioForm = this.fb.group({
      nome: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      cpfCnpj: ['', [Validators.required]],
      tipo: ['Fornecedor', [Validators.required]]
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.carregarUsuarios();
    }, 100);
  }

  carregarUsuarios(): void {
    this.usuarioService.listar().subscribe({
      next: (dados) => {
        this.usuarios = [...dados];
        this.usuariosFiltrados = [...dados];
        this.cdr.detectChanges();
      },
      error: (erro) => console.error('Erro ao carregar usuários', erro)
    });
  }

  filtrar(): void {
    if (!this.filtroAtual) {
      this.usuariosFiltrados = [...this.usuarios];
    } else {
      this.usuariosFiltrados = this.usuarios.filter(u => u.tipo === this.filtroAtual);
    }
    this.cdr.detectChanges();
  }

  abrirModalNovo(): void {
    this.modoEdicao = false;
    this.idUsuarioEmEdicao = null;
    this.usuarioForm.reset({ tipo: 'Fornecedor' });
    this.exibindoModal = true;
  }

  abrirModalEditar(usuario: Usuario): void {
    this.modoEdicao = true;
    this.idUsuarioEmEdicao = usuario.id ?? null;
    this.usuarioForm.patchValue(usuario);
    this.exibindoModal = true;
  }

  fecharModal(): void {
    this.exibindoModal = false;
    this.cdr.detectChanges();
  }

  salvar(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const dadosUsuario: Usuario = this.usuarioForm.value;

    if (this.modoEdicao && this.idUsuarioEmEdicao !== null) {
      this.usuarioService.alterar(this.idUsuarioEmEdicao, dadosUsuario).subscribe({
        next: () => {
          this.fecharModal();
          this.carregarUsuarios();
        },
        error: (err) => console.error('Erro ao alterar usuário', err)
      });
    } else {
      this.usuarioService.criar(dadosUsuario).subscribe({
        next: () => {
          this.fecharModal();
          this.carregarUsuarios();
        },
        error: (err) => console.error('Erro ao criar usuário', err)
      });
    }
  }

  deletarUsuario(id?: number): void {
    if (!id) return;

    if (confirm('Deseja realmente excluir este usuário?')) {
      this.usuarioService.excluir(id).subscribe({
        next: () => {
          this.carregarUsuarios();
        },
        error: (err) => console.error('Erro ao deletar usuário', err)
      });
    }
  }
}