import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Blog } from '../interface/Blog';

@Injectable({
  providedIn: 'root'
})
export class BlogAPIService {
  private baseURL = 'http://localhost:3002';

  constructor(private http: HttpClient) { }

  // Get all blogs with pagination
  getBlogs(page: number = 1, limit: number = 10): Observable<any> {
    return this.http.get(`${this.baseURL}/blogs?page=${page}&limit=${limit}`, { withCredentials: true });
  }

  // Get single blog by ID
  getBlogById(id: string): Observable<Blog> {
    return this.http.get<Blog>(`${this.baseURL}/blogs/${id}`, { withCredentials: true });
  }

  // Create new blog (admin only)
  createBlog(blog: Blog): Observable<any> {
    return this.http.post(`${this.baseURL}/blogs`, blog, { withCredentials: true });
  }

  // Update blog (admin only)
  updateBlog(id: string, blog: Partial<Blog>): Observable<any> {
    return this.http.patch(`${this.baseURL}/blogs/${id}`, blog, { withCredentials: true });
  }

  // Delete blog (admin only)
  deleteBlog(id: string): Observable<any> {
    return this.http.delete(`${this.baseURL}/blogs/${id}`, { withCredentials: true });
  }

  // Get all blogs for admin (with search and filters)
  getBlogsForAdmin(page: number = 1, limit: number = 10, search: string = ''): Observable<any> {
    return this.http.get(`${this.baseURL}/blogs/admin/list?page=${page}&limit=${limit}&search=${search}`, { withCredentials: true });
  }
}

