import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import User from '../models/UserSchema.js';
import { sendOTPEmail } from '../services/nodemailer.js';
dotenv.config();

const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Please provide your email and password." });
  }
  
  // if db is not accessable 
  if (req == undefined) return res.status(500).json({ error: "Something went wrong!" });

  try {
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "Email not found!" });
  if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: "Invalid credentials!" });

  // Generate JWT
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET || "enc",
    { expiresIn: '1h' }
  );

  await User.updateOne({email}, {token});

    // Set token as an HTTP-only cookie
  res.cookie('accessToken', token, {
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15 * 1000,
    path: '/'
  });

  res.cookie('refreshToken', token, {
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000 * 24 * 30,
    path: '/'
  });

  res.status(200).json( {message: 'Login successful!', user: { userId: user._id, name: user.name, email: user.email, role: user.role, accessToken: user.token }});
  } catch (error) {
    console.log('db updation failed!')
    return res.status(500).json({ error: "Something went wrong!" });
  }
};



const register = async (req: Request, res: Response) => {

  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: "Please provide your name, email, password and role." });
  try {
    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: "Email already exists!" });
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await User.insertOne({ name, email, password: hashedPassword, role, otp: { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000), isVerified: false }}); 
    await sendOTPEmail(email, otp, name);
    res.status(200).json({message: 'OTP sent successfully! Please check your email.', user: { name, email, role }});
    
  } catch (error) {
    console.log('db updation failed!', error)
    return res.status(500).json({ error: "Something went wrong!" });
  }
}



const refresh = async (req: Request, res: Response) => {
  //@ts-ignore
  const token = req.token;
  jwt.verify(token, process.env.JWT_SECRET || "enc", (err: any, decoded: any) => {
    if (err && (err as Error).message.includes('expired')) {
      console.log("Token expired!"); // if token is expired then just log it and continue 
    }
    else if (err) { // if there is any other error such as secret key mismatch then return
      console.log(err)
      return res.status(401).json({ error: 'Unauthorized! Token verification failed.' });
    }
  });

  // If db is not accessable 
  if (req == undefined) 
    return res.status(500).json({ error: "Something went wrong!" });

  try {
    // Fetch user from db
    //@ts-ignore
    const user = await User.findOne({ token: req.token });
    if (!user) {
      return res.clearCookie('accessToken').clearCookie('refreshToken').status(401).json({ error: "Unauthorized! Token is not valid!" });
    }

    // Generate JWT
    const newToken = jwt.sign(
      {userId: user._id, role: user.role},
      process.env.JWT_SECRET || "enc",
      { expiresIn: '1h' }
    );

    // Set token as an HTTP-only cookie
    res.cookie('accessToken', newToken, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15 * 1000,
      path: '/'
    });
  
    res.status(200).json({message: 'Token refreshed successfully!', user: { userId: user._id, role: user.role, accessToken: newToken }});

  } catch (error) {
    console.log('db updation failed!')
    return res.status(500).json({ error: "Something went wrong!" });
  }

};



const logout = async (req: Request, res: Response) => {
  
  try {
    //@ts-ignore
    const user = await User.findOne({ token: req.token });
    if (!user) {
      res.clearCookie('accessToken').clearCookie('refreshToken').status(401).json({ error: "Unauthorized! Token is not valid!" });
      return
    }

  await User.updateOne({email: user.email}, {token: ''});
  return res.clearCookie('accessToken').clearCookie('refreshToken').status(200).json({message: 'Logged out successfully'});
  
  } catch (error) {
    console.log('db updation failed!')
    return res.status(500).json({ error: "Something went wrong!" });
  }

}


const getUser = async (req: Request, res: Response) => {
  try {
    //@ts-ignore
  const user = await User.findOne({ _id: req.user.userId });
  if (!user) {
    return res.status(401).json({ error: "Unauthorized! Token is not valid!" });
  }

    res.status(200).json( {message: 'User fetched successfully!', user: { userId: user._id, name: user.name, email: user.email, role: user.role }});
  } catch (error) {
    console.log('getUser error:', error)
    return res.status(500).json({ error: "Something went wrong!" });
  }
}


const verifyOTP = async (req: Request, res: Response) => {
  const { email, otp, password } = req.body;
  if (!email || !otp ) return res.status(400).json({ error: "Please provide your email and OTP." });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Email not found!" });
    if (user.otp?.isVerified) return res.status(401).json({ error: "OTP already verified!" });
    if (user.otp?.code != otp) return res.status(401).json({ error: "Invalid OTP!" });
    if (user.otp?.expiresAt && user.otp.expiresAt < new Date()) return res.status(401).json({ error: "OTP expired!" });
    
    const hashedPassword = password ? await bcrypt.hash(password, 10) : user.password;
    const token = jwt.sign(
      {userId: user._id, role: user.role},
      process.env.JWT_SECRET || "enc",
      { expiresIn: '1h' }
    );
    await User.updateOne({email: user.email}, {otp: { code: '', expiresAt: new Date(), isVerified: true }, password: password ? hashedPassword : user.password, token: token});
  

    res.cookie('accessToken', token, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15 * 1000,
      path: '/'
    });
  
    res.cookie('refreshToken', token, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000 * 24 * 30,
      path: '/'
    });
  
    return res.status(200).json({ message: "OTP verified successfully!", user: { userId: user._id, role: user.role } });
  
  } catch (error) {
    console.log('db updation failed!', error)
    return res.status(500).json({ error: "Something went wrong!" });
  }

}


const resendOTP = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Please provide your email." });
  try {
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "Email not found!" });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await User.updateOne({email: user.email}, {otp: { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000), isVerified: false }});
  await sendOTPEmail(email, otp, user.name);
  res.status(200).json({ message: "OTP sent successfully! Please check your email." });
  } catch (error) {
    console.log('db updation failed!', error)
    return res.status(500).json({ error: "Something went wrong!" });
  }
}


const changePassword = async (req: Request, res: Response) => {
  const { email, oldPassword, newPassword } = req.body;
  if (!email || !oldPassword || !newPassword) return res.status(400).json({ error: "Please provide your email, old password and new password." });
  
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Email not found!" });
    if (!(await bcrypt.compare(oldPassword, user.password))) return res.status(401).json({ error: "Invalid old password!" });
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({email: user.email}, {password: hashedPassword});
    res.status(200).json({ message: "Password changed successfully!" });
  } catch (error) {
    console.log('db updation failed!')
    return res.status(500).json({ error: "Something went wrong!" });
  }
}


const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Please provide your email." });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Email not found!" });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await User.updateOne({email: user.email}, {otp: { code: otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000), isVerified: false }});
    await sendOTPEmail(email, otp, user.name);
    res.status(200).json({ message: "OTP sent successfully! Please check your email." });
  } catch (error) {
    console.log('db updation failed!', error)
    return res.status(500).json({ error: "Something went wrong!" });
  }
}



export {login, register, refresh, logout, getUser, verifyOTP, changePassword, resendOTP, forgotPassword};