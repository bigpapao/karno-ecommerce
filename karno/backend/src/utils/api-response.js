/**
 * ApiResponse Class
 *
 * Custom response class for standardized API responses.
 * Used to create consistent response objects across the API.
 */
export class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
