import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';

export const appRoutes: Routes = [
    { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'inicio',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/inicio/inicio').then(m => m.Inicio)
    },
    {
        path: 'vendas',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/vendas/vendas').then(m => m.Vendas)
    },
    {
        path: 'compras',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/compras/compras').then(m => m.Compras)
    },
    {
        path: 'produtos',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/produtos/produtos').then(m => m.Produtos)
    },
    {
        path: 'usuarios',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/usuarios/usuarios').then(m => m.Usuarios)
    },
    {
        path: 'relatorios',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/relatorios/relatorios').then(m => m.Relatorios)
    }
];