/** An expected failure with an i18n key for the user and an HTTP status for API routes. */
export class MediaError extends Error {
  constructor(
    readonly key: string,
    readonly status: number,
  ) {
    super(key);
  }
}
