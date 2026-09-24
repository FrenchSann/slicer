import {z} from 'zod';
import {eu} from './catalog';
export const checkoutSchema=z.object({items:z.array(z.object({id:z.uuid(),quantity:z.number().int().min(1).max(10)}).strict()).min(1).max(20),country:z.enum(eu)}).strict();
export const contactSchema=z.object({email:z.email().max(254),message:z.string().min(10).max(3000),website:z.string().max(0).optional()});
export const newsletterSchema=z.object({email:z.email().max(254),consent:z.literal('on'),website:z.string().max(0).optional()});
