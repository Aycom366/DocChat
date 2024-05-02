import { z } from "zod";
import { LoginSchema } from "./login";

export const RegisterSchema = LoginSchema.extend({
  name: z.string().min(10, {
    message: "Name must be at least 10 characters long",
  }),
});

export type IRegister = z.infer<typeof RegisterSchema>;
