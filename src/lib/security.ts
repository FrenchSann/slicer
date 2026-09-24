import 'server-only';
import {createHash,createHmac} from 'crypto';
import {serviceDb} from './db';
export const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
export function orderToken(id:string){if(!process.env.TOKEN_SECRET)throw Error('Token secret missing');return createHmac('sha256',process.env.TOKEN_SECRET).update(`order:${id}`).digest('hex')}
export function assertOrigin(req:Request){const origin=req.headers.get('origin');if(origin&&origin!==new URL(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000').origin)throw Error('Origine non autorisée');}
export async function rate(req:Request,scope:string,limit=10){const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local';const {data,error}=await serviceDb().rpc('consume_rate',{p_key:hash(`${scope}:${ip}`),p_limit:limit,p_seconds:600});if(error||!data)throw Error('Trop de demandes. Réessayez dans quelques minutes.');}
export const failure=(message='Service momentanément indisponible.',status=503)=>Response.json({error:message},{status});
