import { motion } from 'framer-motion';

const variants = {
  primary: 'eventforge-button eventforge-button--primary',
  secondary: 'eventforge-button eventforge-button--secondary',
  ghost: 'eventforge-button eventforge-button--ghost',
};

export function Button({ children, variant = 'primary', as = 'button', className = '', ...props }) {
  const Component = typeof as === 'string' ? motion[as] ?? as : as;

  return (
    <Component
      className={`${variants[variant] || variants.primary} ${className}`.trim()}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </Component>
  );
}
