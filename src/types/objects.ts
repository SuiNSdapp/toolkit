import { SuiAddress } from '@mysten/sui.js';

export type SuiNSContract = {
  packageId: SuiAddress;
  suins: SuiAddress;
  registry: SuiAddress;
  reverseRegistry: SuiAddress;
};

export type NameObject = {
  owner: SuiAddress;
  targetAddress: SuiAddress | '';
  avatar?: SuiAddress;
  contentHash?: SuiAddress;
};

export type DataFields = 'avatar' | 'contentHash';

export type NetworkType = 'devnet' | 'testnet';
