import {CartContents} from '@/components/shop';
export const metadata={title:'Votre panier'};
export default function Cart(){return <div className="page cart-page"><span className="eyebrow">VOTRE SÉLECTION</span><h1>LE PANIER.</h1><CartContents/></div>}
