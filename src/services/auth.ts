import { Router } from 'express';
import type { Response } from 'express';

interface AuthRouter extends Router {
  check: (token: string) => Promise<{
    isValid: boolean;
    sendRefreshToken: boolean;
    userId?: string;
    roles?: string[];
  }>;
}

type authDataResponse = {
  message?: string;
  accessToken?: string;
  refreshToken?: string;
};

const setAuthCookie = (res: Response, token: string) => {
  const secure = !['development', 'test'].includes(process.env.NODE_ENV ?? ''); // "production", "development", "test"

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure
    // expires: new Date(Date.now() + process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000) // ein Tag gültig
  });
};

const authServerURL = process.env.AUTH_SERVER_URL;
if (!authServerURL) {
  console.error('No Auth Server URL set');
  process.exit(1);
}

const router = Router();
const auth: AuthRouter = Object.assign(router, {
  check: async (accessToken: string) => {
    const authRes = await fetch(`${authServerURL}/auth/validate`, {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const data = (await authRes.json()) as { message: string; userId: string; roles: string[] };

    return {
      isValid: authRes.status === 200,
      sendRefreshToken: data.message === 'Expired access token',
      userId: data.userId,
      roles: data.roles
    };
  }
});

auth.post('/signup', async (req, res) => {
  const { email, password, passwordConfirmation, service } = req.body;
  const authRes = await fetch(`${authServerURL}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ email, password, passwordConfirmation, service }),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const authData = (await authRes.json()) as authDataResponse;
  if (!authRes.ok)
    throw new Error(authData.message ?? 'Authentication failed', {
      cause: { status: authRes.status }
    });

  const { accessToken, refreshToken, message } = authData;
  if (!accessToken || !refreshToken)
    throw new Error('Signup failed. Check your credentials.', { cause: { status: 400 } });

  setAuthCookie(res, accessToken);

  res.json({ message, refreshToken });
});

auth.post('/signin', async (req, res) => {
  const { email, password, service } = req.body;
  const authRes = await fetch(`${authServerURL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password, service }),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const authData = (await authRes.json()) as authDataResponse;
  if (!authRes.ok)
    throw new Error(authData.message ?? 'Authentication failed', {
      cause: { status: authRes.status }
    });

  const { accessToken, refreshToken, message } = authData;
  if (!accessToken || !refreshToken)
    throw new Error('Signup failed. Check your credentials.', { cause: { status: 400 } });

  setAuthCookie(res, accessToken);

  res.json({ message, refreshToken });
});

auth.delete('/logout', async (req, res) => {
  let accessToken: string | undefined;
  const matches = /token=(.*);?/.exec(req.headers.cookie ?? '');
  if (matches) accessToken = matches[1];
  const { refreshToken } = req.body;

  fetch(`${authServerURL}/auth/logout`, {
    method: 'DELETE',
    body: JSON.stringify({ refreshToken, accessToken }),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  res.clearCookie('token');

  res.json({ message: 'Logout' });
});

auth.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  const authRes = await fetch(`${authServerURL}/auth/refresh`, {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const authData = (await authRes.json()) as authDataResponse;
  if (!authRes.ok)
    throw new Error(authData.message ?? 'Authentication failed', {
      cause: { status: authRes.status }
    });

  const { accessToken, refreshToken: newRefreshToken, message } = authData;
  if (!accessToken || !refreshToken) throw new Error('Refresh failed', { cause: { status: 500 } });

  setAuthCookie(res, accessToken);

  res.json({ message, refreshToken: newRefreshToken });
});

auth.use('/{*any}', (_req, res) => {
  res.status(404).json({ message: 'Invalid route' });
});
export default auth;
