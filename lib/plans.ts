export type Plan = "free" | "basic" | "pro";

export const PLAN_LIMITS: Record<
  Plan,
  {
    generations: number;
    designs: number;
  }
> = {
  free: {
    generations: 5,
    designs: 3,
  },

  basic: {
    generations: 50,
    designs: 10,
  },

  pro: {
    generations: 200,
    designs: 20,
  },
};