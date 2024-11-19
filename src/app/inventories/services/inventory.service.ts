import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Article, ArticleCateg, ArticleCategory, ArticleCategPost, ArticleCondition, ArticleInventoryPost, ArticlePost, ArticleType } from '../models/article.model';
import { Inventory, StatusType, Transaction, TransactionPost } from '../models/inventory.model';
import { PORTInventory } from '../utils/const';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {


  //  private apiArticlesUrl = 'http://localhost:8009/articles'; // URL de la API para los ítems DEL BACK
  //  private apiArticleCategoriesUrl = 'http://localhost:8009/articleCategories';
  //  private apiInventoriesUrl = 'http://localhost:8009/inventories'; // URL de la API para los inventarios
  //  private apiTransactionsUrl = 'http://localhost:8009/transactions'; // URL de la API para las transacciones

   private apiArticlesUrl = PORTInventory + 'articles'; // URL de la API para los ítems DEL BACK
   private apiArticleCategoriesUrl = PORTInventory + 'articleCategories';
   private apiInventoriesUrl = PORTInventory + 'inventories'; // URL de la API para los inventarios
   private apiTransactionsUrl = PORTInventory + 'transactions'; // URL de la API para las transacciones


  constructor(private http: HttpClient) {}


  // CRUD para Ítems
  articleExist(identifier: string) {
    return this.http.post<Boolean>(this.apiArticlesUrl + '/articleVerify', { identifier });
  }

  getArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(this.apiArticlesUrl);
  }

  getArticleInventory(id:number):Observable<ArticleInventoryPost>{
    return this.http.get<ArticleInventoryPost>(this.apiInventoriesUrl+'/'+id);
  }

  addArticle(article: ArticlePost): Observable<ArticlePost> {
    console.log(article);
    return this.http.post<ArticlePost>(this.apiArticlesUrl, article);
  }

  updateArticle(articleId: number, article: Article): Observable<Article> {
    return this.http.put<Article>(`${this.apiArticlesUrl}/${articleId}`, article);
  }

  deleteArticle(article_id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiArticlesUrl}/${article_id}`, { article_status: 'Inactive' });
  }

  getFilteredInventories(filters: any): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`/api/inventories`, { params: filters });
  }

  // CRUD para Inventarios
  getInventories(filters?:{
    measure?: string;
    location?: string;
    articleName?: string;
    stock?: number;
  }
  ): Observable<Inventory[]> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof typeof filters];
        if (value !== undefined && value !== '') {
          params = params.append(key, value.toString());
        }
      });
    }

    return this.http.get<Inventory[]>(this.apiInventoriesUrl, { params });
  }

  getInventoriesUnit(measure: string): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.apiInventoriesUrl}/article/${measure}`);
  }

  addInventory(inventory: Inventory): Observable<Inventory> {
    console.log('servicio', inventory);
    return this.http.post<Inventory>(this.apiInventoriesUrl, inventory);
  }

  addInventoryArticle(articleInventory: ArticleInventoryPost): Observable<ArticleInventoryPost> {
    console.log(articleInventory);
    return this.http.post<ArticleInventoryPost>(this.apiInventoriesUrl+'/newArticle', articleInventory);
  }

  updateInventory(id: number, updatedInventory: Partial<Inventory>): Observable<Inventory> {
    return this.http.put<Inventory>(`${this.apiInventoriesUrl}/${id}`, updatedInventory);
  }
  //  updateInventory(inventory: Inventory): Observable<Inventory> {
   //   return this.http.put<Inventory>(`${this.apiInventoriesUrl}/${inventory.id}`, inventory);
   // }

  deleteInventory(inventoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiInventoriesUrl}/${inventoryId}`);
  }


  // CRUD para Transacciones
  getTransactionsInventory(inventoryId: string): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiTransactionsUrl}/inventory/${inventoryId}`);
}
  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(this.apiTransactionsUrl);
  }

  addTransaction(transaction: TransactionPost, inventoryId: string): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiTransactionsUrl}/${inventoryId}`, transaction);
  }

  updateTransaction(transactionId: number, transaction: Transaction): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.apiTransactionsUrl}/${transactionId}`, transaction);
  }

  deleteTransaction(transaction_id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiTransactionsUrl}/${transaction_id}`, { transaction_status: 'Inactive' });
  }

  getInventoriesPageable(page: number, size: number): Observable<Page<Inventory>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(`${this.apiInventoriesUrl}/pageable`, { params })
  }

  // CRUD para ArticleCategories

  getArticleCategories(): Observable<ArticleCateg[]> {
    return this.http.get<ArticleCateg[]>(`${this.apiArticleCategoriesUrl}`);
  }

  deleteCategories(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiArticleCategoriesUrl}/${categoryId}`);
  }
  updateCategory(id: number, updatedCategory: Partial<ArticleCateg>): Observable<ArticleCateg> {
    return this.http.put<ArticleCateg>(`${this.apiArticleCategoriesUrl}/${id}`, updatedCategory);
  }

  createCategory(category: ArticleCategPost): Observable<ArticleCategPost> {
    console.log('creacion',category);
    return this.http.post<ArticleCategPost>(this.apiArticleCategoriesUrl, category);
  }

  getInventoriesPagedFiltered(
    page: number = 0,
    size: number = 10,
    filters?: {
      article?: string;
      description?: string;
      status?: StatusType;
      articleType?: ArticleType;
      articleCondition?: ArticleCondition;
      location?: string;
    }
  ): Observable<Page<Inventory>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (filters) {
      if (filters.article) params = params.set('article', filters.article);
      if (filters.description) params = params.set('description', filters.description);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.articleType) params = params.set('articleType', filters.articleType);
      if (filters.articleCondition) params = params.set('articleCondition', filters.articleCondition);
      if (filters.location) params = params.set('location', filters.location);
    }

    return this.http.get<Page<Inventory>>(`${this.apiInventoriesUrl}/paginated`, { params });
  }

  getFilteredInventory(unit: string, startDate: string, endDate: string): Observable<Inventory[]> {
    const params = new HttpParams()
      .set('unit', unit)
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<Inventory[]>(`${this.apiInventoriesUrl}/filtered`, { params });
  }
}


export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
