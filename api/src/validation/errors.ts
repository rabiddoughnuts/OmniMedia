type ValidationDetails = {
  formErrors?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
};

export class RequestValidationError extends Error {
  statusCode = 400;
  code = "VALIDATION_ERROR";
  details?: ValidationDetails;

  constructor(message: string, details?: ValidationDetails) {
    super(message);
    this.details = details;
  }
}
