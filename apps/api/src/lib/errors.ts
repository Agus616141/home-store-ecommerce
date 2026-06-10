export const appError = (statusCode: number, message: string): Error =>
  Object.assign(new Error(message), {
    statusCode,
    status: statusCode >= 500 ? "error" : "fail",
  });
