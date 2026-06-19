'use client';

import { motion } from 'framer-motion';

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="mt-auto border-t bg-white py-3 px-6"
    >
      <div className="flex flex-col items-center justify-between gap-1 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          &copy; 2024 PropComply AI + VerifyMe Global. All rights reserved.
        </p>
        <p className="text-sm text-muted-foreground">
          Trust Infrastructure Platform v1.0.0
        </p>
      </div>
    </motion.footer>
  );
}
