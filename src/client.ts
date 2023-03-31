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
  contractObjects: SuiNSContract | undefined;

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
    try {
      return await this.suiProvider.getDynamicFieldObject({
        parentId: parentObjectId,
        name: {
          type: '0x1::string::String',
          value: key,
        },
      });
    } catch (error) {
      if (
        !((error as Error).cause as Error).message.includes(
          'Cannot find dynamic field',
        )
      ) {
        throw error;
      }
      return;
    }
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

    const registryResponse = await this.getDynamicFieldObject(
      (this.contractObjects as SuiNSContract).registry,
      key,
    );
    const resolver = parseObjectDataResponse(registryResponse)
      ?.resolver as SuiAddress;

    let resolverData;
    if (resolver) {
      const resolverResponse = await this.getDynamicFieldObject(resolver, key);
      resolverData = parseResolverContents(
        parseObjectDataResponse(resolverResponse)?.contents,
      );
      if (resolverData) {
        resolverData.resolver = resolver;
      }
    }

    return resolverData ?? {};
  }

  /**
   * Returns the linked address of the input domain if the link was set. Otherwise, it will return undefined.
   *
   * @param domain a domain name ends with .sui or .move.
   */
  async getAddress(domain: string): Promise<string | undefined> {
    const { addr } = await this.getResolverData(domain);

    return addr as string;
  }

  /**
   * Returns the default name of the input address if it was set. Otherwise, it will return undefined.
   *
   * @param address a Sui address.
   */
  async getName(address: string): Promise<string | undefined> {
    const { name } = await this.getResolverData(
      `${address.slice(2)}.addr.reverse`,
    );

    if (!name) return;

    const registryResponse = await this.getDynamicFieldObject(
      (this.contractObjects as SuiNSContract).registry,
      name,
    );
    const owner = parseObjectDataResponse(registryResponse)
      ?.owner as SuiAddress;

    // check if the owner of this name was the input address
    if (address !== owner) return;

    return name as string;
  }
}

export { SuinsClient };
