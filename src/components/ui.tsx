"use client";

import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import Link from "next/link";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** Semantic tone used everywhere status is communicated (icon + text + color, rule #5). */
export type Tone = "success" | "info" | "warning" | "danger" | "neutral";

export const TONE_DOT: Record<Tone, string> = {
  success: "bg-emerald-500",
  info: "bg-blue-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  neutral: "bg-zinc-400",
};

export const TONE_BADGE: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-700",
  info: "bg-blue-50 text-blue-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-rose-50 text-rose-700",
  neutral: "bg-zinc-100 text-zinc-600",
};

const MOTION_TRANSITION = "transition-all duration-200 ease-out";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-hover)] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)]",
  secondary:
    "bg-white text-zinc-900 border border-zinc-300 hover:border-[var(--color-primary)] hover:bg-zinc-50",
  danger:
    "bg-[var(--color-danger)] text-white hover:brightness-90 shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)]",
  ghost: "text-zinc-700 hover:bg-zinc-100",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  href?: string;
}

/** Sign-in / primary CTA style buttons: hover translateY(-1px) + shadow, active scale(0.98). */
export function Button({
  variant = "primary",
  href,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium",
    MOTION_TRANSITION,
    "hover:-translate-y-px active:translate-y-0 active:scale-[0.98]",
    "disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0",
    buttonStyles[variant],
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

/** Icon-only button. Always pass `title` — it doubles as the hover tooltip (rule: hover ≠ only path). */
export function IconButton({
  variant = "ghost",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-[var(--radius-md)] p-2 text-sm font-medium",
        MOTION_TRANSITION,
        "active:scale-[0.98]",
        buttonStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Set true for clickable/important cards that should lift on hover (rule #93: translateY(-2px)). */
  interactive?: boolean;
}

export function Card({ children, className, interactive = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-zinc-200 bg-white shadow-[var(--shadow-xs)]",
        interactive &&
          cn(MOTION_TRANSITION, "hover-lift hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"),
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const fieldBase = cn(
  "w-full rounded-[var(--radius-md)] border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400",
  MOTION_TRANSITION,
  "hover:border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
);

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <input id={inputId} className={cn(fieldBase, className)} {...props} />
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className, id, children, ...props }: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <select id={selectId} className={cn(fieldBase, className)} {...props}>
        {children}
      </select>
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, id, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <textarea id={textareaId} className={cn(fieldBase, className)} {...props} />
    </div>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>
      {children}
    </span>
  );
}

/** The canonical status indicator: icon (dot) + text + color — never color alone (rule #5). */
export function StatusBadge({ tone, label }: { tone: Tone; label: string }) {
  return (
    <Badge className={TONE_BADGE[tone]}>
      <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", TONE_DOT[tone])} aria-hidden />
      {label}
    </Badge>
  );
}

export function ErrorMessage({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-danger-soft)] px-3 py-2 text-sm text-rose-700">
      {message}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-8" role="status" aria-label="Memuat">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-[var(--color-primary)]" />
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-xl">
        📦
      </div>
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <Card interactive className="px-4 py-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color ?? "text-zinc-900"}`}>{value}</p>
    </Card>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      {action}
    </div>
  );
}
