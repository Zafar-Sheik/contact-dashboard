"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import Logo from "@/public/images/logo.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Image
          src={Logo}
          alt="Contact Computers"
          width={500}
          height={400}
          className="rounded-xl"
        />
      </motion.div>
    </div>
  );
}
