import jwt, { SignOptions } from 'jsonwebtoken';

const accessTokenOptions: SignOptions = {
  expiresIn: (process.env.JWT_EXPIRE || '7d') as SignOptions['expiresIn'],
};

const refreshTokenOptions: SignOptions = {
  expiresIn: (process.env.JWT_REFRESH_EXPIRE || '30d') as SignOptions['expiresIn'],
};

export const generateAccessToken = (id: string, role: string): string => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret', accessTokenOptions);
};

export const generateRefreshToken = (id: string, role: string): string => {
  return jwt.sign({ id, role }, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', refreshTokenOptions);
};

export const verifyRefreshToken = (token: string): jwt.JwtPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret') as jwt.JwtPayload;
};