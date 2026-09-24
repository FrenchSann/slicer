import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
export const configured=()=>!!(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
export function publicDb(){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false}})}
export function serviceDb(){if(!process.env.SUPABASE_SERVICE_ROLE_KEY)throw Error('Service indisponible');return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}})}
export async function authDb(){const jar=await cookies();return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll:()=>jar.getAll(),setAll:(items)=>{try{items.forEach(({name,value,options})=>jar.set(name,value,options))}catch{}}}})}
export async function requireAdmin(){if(!configured())throw Error('Non autorisé');const db=await authDb();const {data:{user}}=await db.auth.getUser();if(!user)throw Error('Non autorisé');const {data}=await db.from('administrators').select('user_id').eq('user_id',user.id).single();if(!data)throw Error('Non autorisé');return {db,user};}
