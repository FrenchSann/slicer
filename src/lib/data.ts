import {configured,publicDb} from './db';
import {product,Product} from './catalog';
export async function getProduct(slug='bloom-flow-02'):Promise<Product|null>{if(!configured())return slug===product.slug?product:null;const {data,error}=await publicDb().from('products').select('*,variants(*),images(*)').eq('slug',slug).eq('active',true).single();if(error)return slug===product.slug?product:null;return data as Product;}
export async function getCatalog():Promise<Product[]>{if(!configured())return [product];const {data}=await publicDb().from('products').select('*,variants(*),images(*)').eq('active',true).order('created_at');return data?.length?data as Product[]:[product]}
export async function getSettings(){if(!configured())return null;const {data}=await publicDb().from('store_settings').select('*').eq('id',1).single();return data;}
