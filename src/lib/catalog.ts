export const sizes = ['S','M','L','XL'] as const;
export type Size = typeof sizes[number];
export type Variant = {id:string;size:string;price:number;stock:number;reserved:number;preorder:boolean;preorder_limit:number;preorder_reserved:number;inventory_verified:boolean};
export type Product = {id:string;slug:string;name:string;description:string;composition:string;active:boolean;variants:Variant[];images?:{url:string;alt:string;position:number}[]};
export const product:Product={id:'bloom-flow-02',slug:'bloom-flow-02',name:'BLOOM FLOW 02',description:'Une rose en mouvement. Une ligne précise. Le rashguard SLICER fait entrer un nouvel équilibre sur le tapis.',composition:'80 % polyester · 20 % élasthanne',active:true,variants:sizes.map(size=>({id:`bloom-${size.toLowerCase()}`,size,price:4500,stock:0,reserved:0,preorder:false,preorder_limit:0,preorder_reserved:0,inventory_verified:false}))};
export const money=(cents:number)=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:2}).format(cents/100);
export const eu=['AT','BE','BG','HR','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK'] as const;
