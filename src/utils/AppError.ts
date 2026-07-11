export class AppError extends Error {
  public statusCode: number;
  public errorDetails: any;

  constructor(statusCode: number, message: string, errorDetails: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorDetails = errorDetails;
    
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}