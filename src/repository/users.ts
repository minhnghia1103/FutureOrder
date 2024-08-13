import { BaseRepository } from "./base";
import { Users } from "../entity/Users";

export class UsersRepository extends BaseRepository<Users> {
  constructor() {
    super(Users);
  }
}