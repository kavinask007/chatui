import { motion } from "framer-motion";

export const Overview = () => {
  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex flex-col items-center justify-center space-y-8">
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-lg shadow-lg">
          <kbd className="px-2 py-1 font-mono text-sm bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded border border-zinc-300 dark:border-zinc-700 shadow">Ctrl</kbd>
          <span className="text-zinc-600 dark:text-zinc-400">+</span>
          <kbd className="px-2 py-1 font-mono text-sm bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded border border-zinc-300 dark:border-zinc-700 shadow">Enter</kbd>
          <span className="text-zinc-600 dark:text-zinc-400 ml-2">Opens new chat</span>
        </div>

        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-lg shadow-lg">
          <kbd className="px-2 py-1 font-mono text-sm bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded border border-zinc-300 dark:border-zinc-700 shadow">Ctrl</kbd>
          <span className="text-zinc-600 dark:text-zinc-400">+</span>
          <kbd className="px-2 py-1 font-mono text-sm bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded border border-zinc-300 dark:border-zinc-700 shadow">M</kbd>
          <span className="text-zinc-600 dark:text-zinc-400 ml-2">Opens model select</span>
        </div>

        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 px-4 py-2 rounded-lg shadow-lg">
          <kbd className="px-2 py-1 font-mono text-sm bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded border border-zinc-300 dark:border-zinc-700 shadow">Ctrl</kbd>
          <span className="text-zinc-600 dark:text-zinc-400">+</span>
          <kbd className="px-2 py-1 font-mono text-sm bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded border border-zinc-300 dark:border-zinc-700 shadow">L</kbd>
          <span className="text-zinc-600 dark:text-zinc-400 ml-2">Opens tools select</span>
        </div>
      </div>
    </motion.div>
  );
};
