import { JsonRpcProvider, SuiAddress } from '@mysten/sui.js';

import { ResolverData, SuiNSContract } from './types/objects';
import {
  DEVNET_JSON_FILE,
  GCS_URL,
  TESTNET_JSON_FILE,
} from './utils/constants';
import { parseObjectDataResponse, parseResolverContents } from './utils/parser';

class SuinsClient {
  private suiProvider: JsonRpcProvider;
  private contractObjects: SuiNSContract | undefined;

  constructor(suiProvider: JsonRpcProvider, contractObjects?: SuiNSContract) {
    if (!suiProvider) {
      throw new Error('Sui JsonRpcProvider must be specified.');
    }
    this.suiProvider = suiProvider;
    this.contractObjects = contractObjects;
  }

  async getSuinsContractObjects() {
    if ((this.contractObjects as SuiNSContract)?.packageId) return;

    const contractJsonFileUrl =
      GCS_URL +
      (this.suiProvider.connection.fullnode.includes('testnet')
        ? TESTNET_JSON_FILE
        : DEVNET_JSON_FILE);

    let response;
    try {
      response = await fetch(contractJsonFileUrl);
    } catch (error) {
      throw new Error(
        `Error getting SuiNS contract objects, ${(error as Error).message}`,
      );
    }

    if (!response?.ok) {
      throw new Error(`Network Error: ${response?.status}`);
    }

    this.contractObjects = await response.json();
  }

  protected async getDynamicFieldObject(
    parentObjectId: SuiAddress,
    key: string,
  ) {
    const keyByteVector = Array.from(new TextEncoder().encode(key)).map(
      (byte) => `${byte}u8`,
    );

    return await this.suiProvider.getDynamicFieldObject(
      parentObjectId,
      `0x1::string::String {bytes: vector[${keyByteVector.join(', ')}]}`,
    );
  }

  /**
   * Returns the resolver data including:
   *
   * - resolver?: the resolver address
   * - avatar?: the avatar object address
   * - addr?: the linked address
   * - contenthash?: the ipfs cid
   * - name?: the default domain name of the owner address
   *
   * If the input domain has not been registered, it will return an empty object.
   *
   * @param key a domain name or a reverse address, e.g. `484f1024c91ad8c9824bf46a708e3529251b2bc3.addr.reverse`.
   */
  async getResolverData(key: string): Promise<ResolverData> {
    await this.getSuinsContractObjects();

    try {
      const registryResponse = await this.getDynamicFieldObject(
        (this.contractObjects as SuiNSContract).registry,
        key,
      );

      const resolver = parseObjectDataResponse(registryResponse)
        .resolver as SuiAddress;

      let resolverData: ResolverData = {};
      try {
        const resolverResponse = await this.getDynamicFieldObject(
          resolver,
          key,
        );
        resolverData = parseResolverContents(
          parseObjectDataResponse(resolverResponse).contents,
        );
      } catch (_) {}

      return {
        ...resolverData,
        resolver,
      };
    } catch (error) {
      if (!(error as Error).message.includes('Cannot find dynamic field')) {
        throw error;
      }

      return {};
    }
  }

  /**
   * Returns the linked address of the input domain if the link was set. Otherwise, it will return undefined.
   *
   * @param domain a domain name ends with .sui or .move.
   */
  async getAddress(domain: string): Promise<string> {
    const resolverData = await this.getResolverData(domain);

    return resolverData.addr as string;
  }

  /**
   * Returns the default name of the input address if it was set. Otherwise, it will return undefined.
   *
   * @param address a Sui address.
   */
  async getName(address: string): Promise<string> {
    const resolverData = await this.getResolverData(
      `${address.slice(2)}.addr.reverse`,
    );

    return resolverData.name as string;
  }
}

export { SuinsClient };
