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
      <div className="text-center">
        <p>
          <kbd className="px-2 py-1 font-semibold bg-muted text-blue-500 rounded">Ctrl</kbd> +{" "}
          <kbd className="px-2 py-1 font-semibold bg-muted text-blue-500 rounded">Enter</kbd>{" "}
          starts a new chat.
        </p>
        <div className="my-8"></div>
        <p>
          <kbd className="px-2 py-1 font-semibold bg-muted text-blue-500 rounded">Shift</kbd>{" "}
          +{" "}
          <kbd className="px-2 py-1 font-semibold bg-muted text-blue-500 rounded">Enter</kbd>{" "}
          inserts a new line.
        </p>
      </div>
    </motion.div>
  );
};
