import { ActionError, type ActionAPIContext } from "astro:actions";

type AuthUser = NonNullable<App.Locals["user"]>;

export const requireUser = (context: ActionAPIContext): AuthUser => {
  const locals = context.locals as App.Locals | undefined;
  const user = locals?.user;
  if (!locals?.isAuthenticated || !user) {
    throw new ActionError({ code: "UNAUTHORIZED", message: "Sign in required" });
  }
  return user as AuthUser;
};
