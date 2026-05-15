import { mapBorrower } from "../utils/borrowerMapper";
import { rawBorrowers } from "./rawBorrowers";

export const borrowers = rawBorrowers.map(mapBorrower);
