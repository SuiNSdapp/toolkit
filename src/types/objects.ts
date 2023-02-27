import { SuiAddress } from '@mysten/sui.js';

export type SuiNSContract = {
  packageId: SuiAddress;
  registry: SuiAddress;
};

export type ResolverData = {
  resolver?: SuiAddress;
  addr?: SuiAddress; // linked address
  avatar?: SuiAddress; // custom avatar object id
  contenthash?: string; // ipfs cid
  name?: string; // default domain name
};
