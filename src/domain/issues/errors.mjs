export const ISSUE_ERROR_CODES = Object.freeze({
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  VERSION_CONFLICT: 'VERSION_CONFLICT',
  DUPLICATE_REQUEST: 'DUPLICATE_REQUEST',
  CLOSED_IMMUTABLE: 'CLOSED_IMMUTABLE',
  ATTACHMENT_FORBIDDEN: 'ATTACHMENT_FORBIDDEN'
})

export class IssueServiceError extends Error {
  constructor(code, message = code, details = undefined) {
    super(message)
    this.name = 'IssueServiceError'
    this.code = code
    this.details = details
  }
}

export function issueError(code, message, details) {
  return new IssueServiceError(code, message, details)
}
