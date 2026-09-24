"use client";
import dynamic from "next/dynamic";
const Rose = dynamic(() => import("./rose"), { ssr: false });
export default function HeroScene() {
  return <Rose />;
}
