import { Routes } from '@angular/router';

export const appRoutes: Routes = [
    { path: '', redirectTo: 'inicio', pathMatch: 'full' },

    {
        path: 'inicio',
        loadComponent: () => import('./pages/inicio/inicio').then(m => m.Inicio)
    },
    {
        path: 'vendas',
        loadComponent: () => import('./pages/vendas/vendas').then(m => m.Vendas)
    },
    {
        path: 'compras',
        loadComponent: () => import('./pages/compras/compras').then(m => m.Compras)
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