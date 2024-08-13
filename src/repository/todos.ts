import { BaseRepository } from "./base";
import { Todos } from "../entity/Todos";

export class TodosRepository extends BaseRepository<Todos> {
  constructor() {
    super(Todos);
  }
}