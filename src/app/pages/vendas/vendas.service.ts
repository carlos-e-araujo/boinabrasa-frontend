import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VendaRequest, VendaResponse } from './vendas.model';

@Injectable({
  providedIn: 'root'
})
export class VendaService {

  private apiUrl = 'http://localhost:8080/vendas';

  private headers = new HttpHeaders({
    'Authorization': 'Basic ' + btoa('admin:123')
  });

  constructor(private http: HttpClient) {}

  listar(): Observable<VendaResponse[]> {
    return this.http.get<VendaResponse[]>(this.apiUrl, { headers: this.headers });
  }

  buscarPorId(id: number): Observable<VendaResponse> {
    return this.http.get<VendaResponse>(`${this.apiUrl}/${id}`, { headers: this.headers });
  }

  criar(venda: VendaRequest): Observable<VendaResponse> {
    return this.http.post<VendaResponse>(this.apiUrl, venda, { headers: this.headers });
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.headers });
  }
}