/**
 * Error types and utilities for reporting services
 */

export enum ReportErrorType {
  DATA_FETCH_ERROR = 'DATA_FETCH_ERROR',
  PDF_GENERATION_ERROR = 'PDF_GENERATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NO_DATA_ERROR = 'NO_DATA_ERROR',
}

export interface ReportError {
  type: ReportErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  originalError?: Error;
}

/**
 * Create a ReportError with Portuguese user message
 */
export function createReportError(
  type: ReportErrorType,
  message: string,
  originalError?: Error,
  retryable: boolean = true
): ReportError {
  const userMessages: Record<ReportErrorType, string> = {
    [ReportErrorType.DATA_FETCH_ERROR]:
      'Não foi possível carregar os dados do relatório. Tente novamente.',
    [ReportErrorType.PDF_GENERATION_ERROR]:
      'Erro ao gerar o PDF. Verifique o espaço disponível e tente novamente.',
    [ReportErrorType.STORAGE_ERROR]:
      'Espaço insuficiente no dispositivo. Libere espaço e tente novamente.',
    [ReportErrorType.NETWORK_ERROR]: 'Sem conexão com a internet. Conecte-se e tente novamente.',
    [ReportErrorType.PERMISSION_ERROR]:
      'Permissão necessária para salvar o arquivo. Verifique as configurações.',
    [ReportErrorType.NO_DATA_ERROR]:
      'Nenhum dado disponível para gerar o relatório. Complete alguns testes primeiro.',
  };

  return {
    type,
    message,
    userMessage: userMessages[type],
    retryable,
    originalError,
  };
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('timeout')
    );
  }
  return false;
}

/**
 * Check if an error is a storage error
 */
export function isStorageError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('storage') ||
      message.includes('disk') ||
      message.includes('space') ||
      message.includes('quota')
    );
  }
  return false;
}

/**
 * Check if an error is a permission error
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('permission') ||
      message.includes('denied') ||
      message.includes('unauthorized')
    );
  }
  return false;
}

/**
 * Categorize an unknown error into a ReportErrorType
 */
export function categorizeError(error: unknown): ReportErrorType {
  if (isNetworkError(error)) {
    return ReportErrorType.NETWORK_ERROR;
  }
  if (isStorageError(error)) {
    return ReportErrorType.STORAGE_ERROR;
  }
  if (isPermissionError(error)) {
    return ReportErrorType.PERMISSION_ERROR;
  }
  return ReportErrorType.DATA_FETCH_ERROR;
}
