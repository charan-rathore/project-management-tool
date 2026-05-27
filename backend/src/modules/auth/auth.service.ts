import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { config } from '../../config/env';

// Why is business logic in the service, not controller?
// Controllers should be thin — they only parse requests and send responses.
// Services contain the actual logic and are testable in isolation.

export async function registerUser(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('Email already registered');
  }

  // Why bcrypt? Passwords must never be stored in plaintext.
  // bcrypt is a slow hash function designed specifically for passwords.
  // Slow = harder for attackers to brute-force if DB is compromised.
  // The salt rounds (12) make it computationally expensive.
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  const token = generateToken(user);
  return { user, token };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Why the same error message for "user not found" and "wrong password"?
  // Security: Don't reveal whether the email exists in the system.
  // This prevents account enumeration attacks.
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user);
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}

function generateToken(user: { id: string; email: string; role: string; name: string }) {
  // Why JWT?
  // The server signs a token containing user identity.
  // The client stores it and sends it with every request.
  // The server verifies the signature — no DB lookup needed to authenticate.
  // This is stateless auth: scales horizontally without shared session storage.
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
  );
}
