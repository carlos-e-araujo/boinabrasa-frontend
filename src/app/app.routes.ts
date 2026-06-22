import { Routes } from '@angular/router';

export const appRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/inicio/inicio').then(m => m.Inicio)
    },
    {
        path: 'vendas',
        loadComponent: () => import('./pages/vendas/vendas').then(m => m.Vendas)
    },
    {
        path: 'produtos',
        loadComponent: () => import('./pages/produtos/produtos').then(m => m.Produtos)
    },
    {
        path: 'usuarios',
        loadComponent: () => import('./pages/usuarios/usuarios').then(m => m.Usuarios)
    },
    {
        path: 'relatorios',
        loadComponent: () => import('./pages/relatorios/relatorios').then(m => m.Relatorios)
    }
];
