import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/UserSchema.js';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const headers = req.headers.authorization || '';
  let token = headers.startsWith('Bearer ') ? headers.slice(7) : null;
  if (!token) {
    token = req.cookies?.accessToken;
  }

  // @ts-ignore
  req.token = token;  // attached to be used in routesControllers
  
  if (req.path === '/api/auth/login' || req.path === '/api/auth/register' || req.path === '/api/auth/verify-otp' || req.path === '/api/auth/resend-otp' || req.path === '/api/auth/forgot-password') return next(); // Bypass auth if requested to login or refresh route
  

  if (req.path === '/api/auth/refresh') {
    token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
    jwt.verify(token, process.env.JWT_SECRET || "enc");
    const user = await User.findOne({ token });
    if (user) {
      // @ts-ignore
      req.token = token;
      return next();
    }
    } catch (err) {
      console.log("refresh verification failed!", err)
      return res.clearCookie('accessToken').clearCookie('refreshToken').status(401).json({ error: 'Unauthorized' });
    }
  }
  

  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    jwt.verify(token, process.env.JWT_SECRET || "enc");
    const user = jwt.decode(token);
    if (user) {
      // @ts-ignore
      req.user = user;
    }
    else throw new Error("Token not found in db!");
    next();
  } catch (err) {
    if (err && (err as Error).message.includes('expired')){
      
      return res.clearCookie('accessToken').status(403).json({ error: 'Token expired!' });
    } 
    else 
      console.log(err)
      return res.status(401).json({ error: 'Unauthorized! Token verification failed.' });
  }
};