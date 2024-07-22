import { z } from "zod";
import { LoginSchema } from "./login";

export const RegisterSchema = LoginSchema.extend({
  name: z.string().min(6, {
    message: "Name must be at least 6 characters long",
  }),
});

export type IRegister = z.infer<typeof RegisterSchema>;
