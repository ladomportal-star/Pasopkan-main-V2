import { motion } from 'motion/react';

export default function DotsLoader({ className = "", text }: { className?: string; text?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="flex items-center justify-center gap-2.5">
        {[0, 1, 2, 3].map((index) => (
          <motion.div
            key={index}
            className="w-4 h-4 bg-adv-orange rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: index * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      {text && <p className="text-adv-orange font-medium animate-pulse">{text}</p>}
    </div>
  );
}