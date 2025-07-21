/* For custom types used in more than one module */
declare namespace Express {
  export interface Request {
    user?: string;
    roles?: string[];
  }
}
