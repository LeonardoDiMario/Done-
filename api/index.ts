import express from 'express';

/**
 * Vercel adapter for the standalone RubyChan Express app.
 * The legacy server.ts calls app.listen() during startup; on Vercel we
 * intercept that call and expose the fully configured Express instance as
 * the serverless function handler instead.
 */
const expressApplication = (express as any).application;
const originalListen = expressApplication.listen;
let rubyChanApp: any;

expressApplication.listen = function (this: any, ..._args: any[]) {
  rubyChanApp = this;
  return this;
};

process.env.APP_URL =
  process.env.APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

const serverReady = import('../server').then(() => {
  expressApplication.listen = originalListen;
  if (!rubyChanApp) {
    throw new Error('RubyChan Express app was not initialized.');
  }
  return rubyChanApp;
});

export default async function handler(req: any, res: any) {
  const app = await serverReady;
  return app(req, res);
}
