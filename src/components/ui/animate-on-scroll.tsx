'use client'

import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'

const EASE = [0.16, 1, 0.3, 1] as const

const fadeUpVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const staggerItemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

type FadeUpProps = HTMLMotionProps<'div'> & {
  delay?: number
  as?: keyof typeof motion
}

export function FadeUp({ delay = 0, className, children, ...props }: FadeUpProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      variants={fadeUpVariants}
      viewport={{ once: true, amount: 0.12 }}
      whileInView="visible"
      transition={{ duration: 0.6, ease: EASE, delay }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

type StaggerListProps = {
  children: React.ReactNode
  className?: string
}

export function StaggerList({ children, className }: StaggerListProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      variants={staggerContainerVariants}
      viewport={{ once: true, amount: 0.1 }}
      whileInView="visible"
    >
      {children}
    </motion.div>
  )
}

type StaggerItemProps = {
  children: React.ReactNode
  className?: string
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      className={className}
      variants={staggerItemVariants}
      transition={{ duration: 0.55, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
