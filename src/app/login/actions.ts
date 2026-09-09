"use server";

import { cookies } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// CONFIGURACIÓN EXIGIDA POR PRISMA 7 (Driver Adapter)
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function loginAction(correo: string, contrasena: string) {
  const usuario = await prisma.usuario.findUnique({
    where: { correo: correo }
  });

  if (usuario && usuario.contrasena === contrasena) {
    const cookieStore = await cookies();
    const config = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    };
    
    cookieStore.set("jared_auth_token", "acceso_autorizado", config);
    cookieStore.set("jared_user_nombre", usuario.nombres, config);
    cookieStore.set("jared_user_inicial", usuario.nombres.charAt(0).toUpperCase(), config);
    
    return { success: true };
  }

  return { success: false, message: "Correo o contraseña incorrectos." };
}

export async function registerAction(datos: any) {
  if (datos.contrasena !== datos.confirmarContrasena) {
    return { success: false, message: "Las contraseñas no coinciden." };
  }

  const usuarioExistente = await prisma.usuario.findUnique({
    where: { correo: datos.correo }
  });

  if (usuarioExistente) {
    return { success: false, message: "Este correo ya se encuentra registrado." };
  }

  const nuevoUsuario = await prisma.usuario.create({
    data: {
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      celular: datos.celular,
      correo: datos.correo,
      contrasena: datos.contrasena,
    }
  });

  const cookieStore = await cookies();
  const config = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  };
  
  cookieStore.set("jared_auth_token", "acceso_autorizado", config);
  cookieStore.set("jared_user_nombre", nuevoUsuario.nombres, config);
  cookieStore.set("jared_user_inicial", nuevoUsuario.nombres.charAt(0).toUpperCase(), config);
  
  return { success: true };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("jared_auth_token");
  cookieStore.delete("jared_user_nombre");
  cookieStore.delete("jared_user_inicial");
  return { success: true };
}

export async function getLoggedUser() {
  const cookieStore = await cookies();
  return {
    nombre: cookieStore.get("jared_user_nombre")?.value || "Usuario",
    inicial: cookieStore.get("jared_user_inicial")?.value || "U"
  };
}