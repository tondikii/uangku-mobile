import {User} from "./";

export interface Wallet {
  id: number;
  name: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export type WalletResponse = Wallet[];
