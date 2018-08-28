import { randomStringGenerator } from './utils';
import { InvalidFormatError } from './errors';

/** This is the string generator for persistent ids */
let persistentGenerator = randomStringGenerator.bind(null, 32);

/** This is the string generator for transient ids */
let transientGenerator = randomStringGenerator.bind(null, 24);

export interface IDToken  {
  persistent: string;
  transient: string;
  created: Date;
  lastUpdated: Date;
}

export class DToken implements IDToken {

  persistent: string;
  transient: string;
  created: Date;
  lastUpdated: Date;

  /**
   * This function will overwrite how DTokens create persistent ids
   * @example
   *  // If you want to roll your own
   *  function hmacStringGenerator() {
   *    return crypto.createHmac(
   *      'md5',  // replace with sha256 for 64 char len
   *       new Date().toISOString()
   *    )
   *    .digest('hex');
   *  }
   *
   * @example 
   *  // If you are using BSON, this is a 24 len string
   *  function objectIdStringGenerator() {
   *    return new ObjectId().toHexString();
   *  }
   * @param fn A no-argument function that generates persistent ids
   */
  static setPersistentGenerator(fn: () => string) {
    let str = fn();
    if (typeof str !== 'string')
      throw new Error('Invalid generator provided. () => string is required.');
    persistentGenerator = fn;
  }

  /**
   * This function will overwrite how DTokens create transient ids
   * @example
   *  // If you want to roll your own
   *  function hmacStringGenerator() {
   *    return crypto.createHmac(
   *      'md5',  // replace with sha256 for 64 char len
   *       new Date().toISOString()
   *    )
   *    .digest('hex');
   *  }
   *
   * @example 
   *  // If you are using BSON, this is a 24 len string
   *  // This has the benefit of being able to parse it, and
   *  // know when it was created
   *  function objectIdStringGenerator() {
   *    return new ObjectId().toHexString();
   *  }
   * @param fn A no-argument function that generates persistent ids
   */
  static setTransientGenerator(fn: () => string) {
    let str = fn();
    if (typeof str !== 'string')
      throw new Error('Invalid generator provided. () => string is required.');
    transientGenerator = fn;
  }

  /**
   * Parse a DToken from a string.
   * Format: 'PERSISTENT_TRANSIENT:CREATED_UPDATED'.
   * 
   * Created and updated are optional, but must be unix timestamp format.
   * If created and updated are not provided, they will be automatically
   * set to Date.now()
   *
   * @example
   *  // Create a new token from a string, no dates (set to now)
   *  DToken.fromString('PERSISTENT_TRANSIENT')
   *  // Create a new token with a set created date, last updated set to now
   *  DToken.fromString('PERSISTENT_TRANSIENT:1535454879537')
   *  // Create a new token with all fields set.
   *  DToken.fromString('PERSISTENT_TRANSIENT:1535454850203_1535454879537')
   * @param token The token string to parse
   */
  static fromString(token: string): DToken {
    let pieces = token.split(':').map(str => str.split('_'));
    if (pieces[0].length !== 2)
      throw new InvalidFormatError(token, 'PERSISTENT_TRANSIENT:CREATED?_LASTUPDATED?');

    let persistent = pieces[0][0],
        transient = pieces[0][1],
        created,
        lastUpdated;

    if (pieces.length > 1) {
      created = new Date(parseInt(pieces[1][0]));
      lastUpdated = pieces[1][1] == null
        ? new Date()
        : new Date(parseInt(pieces[1][1]));

      if (isNaN(created.valueOf()))
        throw new Error('An invalid unix timestamp was provided for created');

      if (isNaN(lastUpdated))
        throw new Error('An invalid unix timestamp was provided for lastUpdated');
    }

    return new DToken(persistent, transient, created, lastUpdated);
  }

  /**
   * Initialize a DToken from a raw-object. Useful for pulling from databases.
   * @param obj
   */
  static fromObject(obj: IDToken) {
    return new DToken(obj.persistent, obj.transient, obj.created, obj.lastUpdated);
  }

  constructor(
    persistent?: string,
    transient?: string,
    created?: Date,
    lastUpdated?: Date
  ) {
    this.persistent  = persistent || persistentGenerator();
    this.transient   = transient || transientGenerator();
    this.created     = created || new Date();
    this.lastUpdated = lastUpdated || new Date();
  }

  /**
   * Returns this DToken in the format PERSISTENT_TRANSIENT:CREATED_LASTUPDATED
   */
  toString() {
    return `${this.persistent}_${this.transient}:${this.created}_${this.lastUpdated}`;
  }

  /**
   * Generates a new transient id, and returns the old transient id
   */
  next(): string {
    let old = this.transient;
    this.transient = transientGenerator();
    return old;
  }

  /**
   * Validate another DToken against this one
   * @param token
   */
  validate(token: IDToken) {
    return token.created.valueOf() === this.created.valueOf()
      && token.lastUpdated.valueOf() === this.lastUpdated.valueOf()
      && token.persistent.valueOf() === this.persistent.valueOf()
      && token.transient.valueOf() === this.transient.valueOf();
  }

  /**
   * Validate a string against this DToken
   * 
   * @param token
   */
  validateString(token: string) {
    return this.validate(DToken.fromString(token));
  }
}
