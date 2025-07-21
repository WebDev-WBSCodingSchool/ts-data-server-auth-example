import type { RequestHandler } from 'express';
import { auth } from '#services';

const tokenRegEx = /token=(.*);?/;
const unauthorizedError = new Error('Not authorized', { cause: { status: 401 } });

const authenticate: RequestHandler = async (req, _res, next) => {
  const matches = tokenRegEx.exec(req.headers.cookie ?? '');
  if (!matches) return next(unauthorizedError);
  const token = matches[1];
  if (!token) return next(unauthorizedError);

  const { isValid, sendRefreshToken, userId, roles } = await auth.check(token);

  if (!isValid) {
    if (sendRefreshToken) {
      const expiredTokenError = new Error('Access token expired', {
        cause: { status: 401, code: 'ACCESS_TOKEN_EXPIRED' }
      });
      return next(expiredTokenError);
    }

    return next(unauthorizedError);
  }

  req.user = userId;
  req.roles = roles;

  next();
};

export default authenticate;
