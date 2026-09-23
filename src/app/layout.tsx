import type {Metadata} from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700-italic.css';
import './globals.css';
import {ShopProvider,Header,Footer} from '@/components/shop';
export const metadata:Metadata={title:{default:'SLICER — La précision en mouvement',template:'%s — SLICER'},description:'BLOOM FLOW 02. Le rashguard de grappling no-gi SLICER. Une rose sculpturale, la précision du mouvement.',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="fr"><body><ShopProvider><a href="#main" className="skip">Aller au contenu</a><Header/><main id="main">{children}</main><Footer/></ShopProvider></body></html>}
