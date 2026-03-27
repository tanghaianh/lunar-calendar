export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type Nullable<T> = T | null;
