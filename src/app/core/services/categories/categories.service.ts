import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';

import { CategoryTree, CategoryTreeHelper } from '../../models/category-tree/category-tree.model';
import { CategoryData } from '../../models/category/category.interface';
import { CategoryMapper } from '../../models/category/category.mapper';
import { CategoryHelper } from '../../models/category/category.model';
import { ApiService, unpackEnvelope } from '../api/api.service';

/**
 * The Categories Service handles the interaction with the 'categories' REST API.
 */
@Injectable({ providedIn: 'root' })
export class CategoriesService {
  constructor(private apiService: ApiService, private categoryMapper: CategoryMapper) {}

  /**
   * Get the full Category data for the given unique category ID.
   * @param categoryUniqueId  The unique category id for the category of interest (encodes the category path).
   * @returns                 The Category information.
   */
  getCategory(categoryUniqueId: string): Observable<CategoryTree> {
    if (!categoryUniqueId) {
      return throwError('getCategory() called without categoryUniqueId');
    }

    return this.apiService
      .get<CategoryData>(`categories/${CategoryHelper.getCategoryPath(categoryUniqueId)}`)
      .pipe(map(element => this.categoryMapper.fromData(element)));
  }

  /**
   * Get the sorted top level categories (e.g. for main navigation creation) with sorted sub categories up to the given depth.
   * @param limit  The number of levels to be returned (depth) in hierarchical view.
   * @returns      A Sorted list of top level categories with sub categories.
   */
  getTopLevelCategories(limit: number): Observable<CategoryTree> {
    let params = new HttpParams().set('imageView', 'NO-IMAGE');
    if (limit > 0) {
      params = params.set('view', 'tree').set('limit', limit.toString());
    }

    return this.apiService.get('categories', { params }).pipe(
      unpackEnvelope<CategoryData>(),
      map(categoriesData =>
        categoriesData
          .map(element => this.categoryMapper.fromData(element))
          .reduce((a, b) => CategoryTreeHelper.merge(a, b), CategoryTreeHelper.empty())
      )
    );
  }
}
