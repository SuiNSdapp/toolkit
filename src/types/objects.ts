import { SuiAddress } from '@mysten/sui.js';

export type SuiNSContract = {
  packageId: SuiAddress;
  registry: SuiAddress;
};

export type ResolverData = {
  owner: SuiAddress;
  ttl: number;
  linkedAddr: SuiAddress | '';
  defaultDomainName: SuiAddress | '';
  data?: SuiAddress;
  avatar?: SuiAddress;
  contentHash?: SuiAddress;
};

export type DataFields = 'avatar' | 'contentHash';

export type NetworkType = 'devnet' | 'testnet';
