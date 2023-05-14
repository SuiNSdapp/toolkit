import {
  JsonRpcProvider,
  SuiAddress,
  getObjectDisplay,
  getObjectOwner,
} from '@mysten/sui.js';

import {
  DataFields,
  NetworkType,
  NameObject,
  SuiNSContract,
} from './types/objects';
import {
  DEVNET_JSON_FILE,
  GCS_URL,
  TESTNET_JSON_FILE,
} from './utils/constants';
import {
  camelCase,
  parseObjectDataResponse,
  parseRegistryResponse,
} from './utils/parser';

export const AVATAR_NOT_OWNED = 'AVATAR_NOT_OWNED';

class SuinsClient {
  private suiProvider: JsonRpcProvider;
  contractObjects: SuiNSContract | undefined;
  networkType: NetworkType | undefined;

  constructor(
    suiProvider: JsonRpcProvider,
    options?: {
      contractObjects?: SuiNSContract;
      networkType?: NetworkType;
    },
  ) {
    if (!suiProvider) {
      throw new Error('Sui JsonRpcProvider must be specified.');
    }
    this.suiProvider = suiProvider;
    this.contractObjects = options?.contractObjects;
    this.networkType = options?.networkType;
  }

  async getSuinsContractObjects() {
    if ((this.contractObjects as SuiNSContract)?.packageId) return;

    const contractJsonFileUrl =
      GCS_URL +
      (this.networkType === 'testnet' ? TESTNET_JSON_FILE : DEVNET_JSON_FILE);

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
    key: any,
    type = '0x1::string::String',
  ) {
    const dynamicFieldObject = await this.suiProvider.getDynamicFieldObject({
      parentId: parentObjectId,
      name: {
        type: type,
        value: key,
      },
    });

    if (dynamicFieldObject.error?.code === 'dynamicFieldNotFound') return;

    return dynamicFieldObject;
  }

  protected async getNameData(
    dataObjectId: SuiAddress,
    fields: DataFields[] = [],
  ) {
    if (!dataObjectId) return {};

    const { data: dynamicFields } = await this.suiProvider.getDynamicFields({
      parentId: dataObjectId,
    });

    const filteredFields = new Set(fields);
    const filteredDynamicFields = dynamicFields.filter(({ name: { value } }) =>
      filteredFields.has(value),
    );

    const data = await Promise.allSettled(
      filteredDynamicFields?.map(({ objectId }) =>
        this.suiProvider
          .getObject({
            id: objectId,
            options: { showContent: true },
          })
          .then(parseObjectDataResponse)
          .then((object) => [camelCase(object.name), object.value]),
      ) ?? [],
    );

    const fulfilledData = data.filter(
      (e) => e.status === 'fulfilled',
    ) as PromiseFulfilledResult<[string, any]>[];

    return Object.fromEntries(fulfilledData.map((e) => e.value));
  }

  /**
   * Returns the name object data including:
   *
   * - id: the name object address
   * - owner: the owner address // only if you add the `showOwner` parameter. It includes an extra RPC call.
   * - targetAddress: the linked address
   * - avatar?: the custom avatar id // Only if you add showAvatar parameter. It includes an extra RPC call.
   * - contentHash?: the ipfs cid
   *
   * If the input domain has not been registered, it will return an empty object.
   * If `showAvatar` is included, the owner will be fetched as well.
   *
   * @param key a domain name
   */
  async getNameObject(
    name: string,
    options: { showOwner?: boolean; showAvatar?: boolean } | undefined = {
      showOwner: false,
      showAvatar: false,
    },
  ): Promise<NameObject> {
    const [, domain, topLevelDomain] = name.match(/^(.+)\.([^.]+)$/) || [];
    await this.getSuinsContractObjects();

    const registryResponse = await this.getDynamicFieldObject(
      (this.contractObjects as SuiNSContract).registry,
      [domain, topLevelDomain],
      `${this.contractObjects?.packageId}::domain::Domain`,
    );

    const nameObject = parseRegistryResponse(registryResponse);

    // check if we should also query for avatar.
    // we can only query if the object has an avatar set
    // and the query includes avatar.
    const includeAvatar = nameObject.avatar && options?.showAvatar;

    if ((options?.showOwner || includeAvatar) && nameObject.nftId) {
      const ownerResponse = await this.suiProvider.getObject({
        id: nameObject.nftId,
        options: { showOwner: true },
      });
      nameObject.owner =
        (getObjectOwner(ownerResponse) as { AddressOwner: string })
          ?.AddressOwner || null;
    }

    // Query for domain's avatar.
    if (includeAvatar) {
      const avatarNft = await this.suiProvider.getObject({
        id: nameObject.avatar,
        options: {
          showDisplay: true,
          showOwner: true,
        },
      });
      // Check that the NFT is still owned by the owner of the domain
      // otherwise don't return the avatar.
      // replace domain.owner with the owner the SDK receives.

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore-next-line
      if (getObjectOwner(avatarNft)?.AddressOwner === nameObject.owner) {
        const display = getObjectDisplay(avatarNft);
        nameObject.avatar = display?.data?.image_url || null;
      } else {
        nameObject.avatar = AVATAR_NOT_OWNED;
      }
    } else {
      delete nameObject.avatar;
    }

    return nameObject;
  }

  /**
   * Returns the linked address of the input domain if the link was set. Otherwise, it will return undefined.
   *
   * @param domain a domain name ends with `.sui`
   */
  async getAddress(domain: string): Promise<string | undefined> {
    const { targetAddress } = await this.getNameObject(domain);

    return targetAddress;
  }

  /**
   * Returns the default name of the input address if it was set. Otherwise, it will return undefined.
   *
   * @param address a Sui address.
   */
  async getName(address: string): Promise<string | undefined> {
    const res = await this.getDynamicFieldObject(
      this.contractObjects?.reverseRegistry ?? '',
      address,
      'address',
    );
    const data = parseObjectDataResponse(res);

    return data?.value;
  }
}

export { SuinsClient };
