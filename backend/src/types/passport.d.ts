import { User as AppUser } from "./api";

declare global {
  namespace Express {
    interface User extends AppUser {}
  }
}
