import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompraRequest, CompraResponse } from './compras.model';

@Injectable({
  providedIn: 'root'
})
export class CompraService {

  private apiUrl = 'http://localhost:8080/compras';

  private headers = new HttpHeaders({
    'Authorization': 'Basic ' + btoa('admin:123')
  });

  constructor(private http: HttpClient) {}

  listar(): Observable<CompraResponse[]> {
    return this.http.get<CompraResponse[]>(this.apiUrl, { headers: this.headers });
  }

  criar(compra: CompraRequest): Observable<CompraResponse> {
    return this.http.post<CompraResponse>(this.apiUrl, compra, { headers: this.headers });
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.headers });
  }
}