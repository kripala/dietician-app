/**
 * Admin service for user and role management
 */

import apiClient from './apiClient';
import {
  PaginatedUsersResponse,
  UserResponse,
  UserSummary,
  Action,
  Role,
  CreateUserRequest,
  UpdateUserRequest,
  MessageResponse,
} from '../types';

class AdminService {
  private baseUrl = '/admin';

  /**
   * Get paginated list of users by role
   */
  async getUsers(
    role?: string,
    page = 0,
    size = 10
  ): Promise<PaginatedUsersResponse> {
    const params: any = { page, size };
    if (role) params.role = role;

    const response = await apiClient.get(`${this.baseUrl}/users`, params);

    // The response is a Spring Page object, transform it
    return {
      content: response.content || response,
      totalPages: response.totalPages,
      totalElements: response.totalElements,
      size: response.size || response.pageable?.pageSize || size,
      number: response.number || response.pageable?.pageNumber || page,
    };
  }

  /**
   * Get user details by ID
   */
  async getUserById(userId: number): Promise<UserResponse> {
    return apiClient.get(`${this.baseUrl}/users/${userId}`);
  }

  /**
   * Create a new user
   */
  async createUser(request: CreateUserRequest): Promise<UserResponse> {
    return apiClient.post(`${this.baseUrl}/users`, request);
  }

  /**
   * Update user details
   */
  async updateUser(userId: number, request: UpdateUserRequest): Promise<UserResponse> {
    return apiClient.put(`${this.baseUrl}/users/${userId}`, request);
  }

  /**
   * Set user active/inactive status
   */
  async setUserStatus(userId: number, active: boolean): Promise<MessageResponse> {
    return apiClient.patch(
      `${this.baseUrl}/users/${userId}/status`,
      null,
      { params: { active } }
    );
  }

  /**
   * Reset user password (sends email with temp password)
   */
  async resetPassword(userId: number): Promise<MessageResponse> {
    return apiClient.post(`${this.baseUrl}/users/${userId}/reset-password`);
  }

  /**
   * Get all actions for a specific role
   */
  async getRoleActions(roleId: number): Promise<Action[]> {
    return apiClient.get(`${this.baseUrl}/roles/${roleId}/actions`);
  }

  /**
   * Update role actions
   */
  async updateRoleActions(roleId: number, actionIds: number[]): Promise<MessageResponse> {
    return apiClient.put(`${this.baseUrl}/roles/${roleId}/actions`, { actionIds });
  }

  /**
   * Get all available actions
   */
  async getAllActions(): Promise<Action[]> {
    return apiClient.get(`${this.baseUrl}/actions`);
  }

  /**
   * Get all available roles from backend
   * This allows the frontend to be dynamic and adapt to role changes
   */
  async getAllRoles(): Promise<Role[]> {
    return apiClient.get<Role[]>(`${this.baseUrl}/roles`);
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: number): Promise<MessageResponse> {
    return apiClient.delete(`${this.baseUrl}/users/${userId}`);
  }
}

export default new AdminService();
